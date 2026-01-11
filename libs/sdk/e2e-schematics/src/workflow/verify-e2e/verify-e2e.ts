import { existsSync, readFileSync } from 'fs';

import { BuildSummary, Fetch, checkPercyBuild } from '../percy-api/percy-api';
import {
  formatBuildStatus,
  isAlertWorthy,
  logDebug,
} from '../percy-api/percy-error';
import { readPercyBuildNumberFromLogString } from '../percy-api/read-build-number-from-logs';

/**
 * Represents a GitHub Actions workflow job
 */
export interface WorkflowJob {
  id: string;
  name: string;
  conclusion: string;
  steps: WorkflowJobStep[];
}

/**
 * Represents a step within a workflow job
 */
export interface WorkflowJobStep {
  name: string;
  conclusion: string;
}

/**
 * Summary of a Percy workflow step
 */
export interface WorkflowStepSummary {
  project: string;
  skipped: boolean;
  succeeded: boolean;
}

/**
 * Result of retrieving a build ID
 */
export interface BuildIdResult {
  buildId: string | undefined;
  source: 'file' | 'logs' | 'not_found';
}

/**
 * GitHub Actions core interface
 */
type Core = {
  debug: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  notice: (message: string) => void;
  info: (message: string) => void;
  setFailed: (message: string) => void;
  setOutput: (name: string, value: string) => void;
};

/**
 * Logger interface for Percy operations
 */
export type Logger = Pick<
  Core,
  'debug' | 'error' | 'info' | 'notice' | 'warning'
>;

/**
 * Call from GitHub Actions workflow:
 *
 * await verifyE2e(
 *   e2eProjects,
 *   '${{ runner.temp }}/percy-builds',
 *   core,
 *   {
 *     listJobsForWorkflowRun: github.rest.actions.listJobsForWorkflowRun
 *   },
 *   allowMissingScreenshots,
 *   (url) => fetch(url, options),
 *   (number) => process.exit(number)
 * );
 */
export async function verifyE2e(
  e2eProjects: string[],
  buildIdFiles: string[],
  core: Core,
  githubApi: {
    listJobsForWorkflowRun: () => Promise<WorkflowJob[][]>;
    downloadJobLogs: (job_id: string) => Promise<string>;
  },
  allowMissingScreenshots: boolean,
  /* istanbul ignore next */
  fetchClient: Fetch = fetch,
  /* istanbul ignore next */
  exit: (code?: number) => void = process.exit,
): Promise<void> {
  if (e2eProjects.length > 0 && e2eProjects[0] !== 'skip') {
    // Verify that Percy has finished processing the E2E Visual Review and that all snapshots have passed.

    core.info('Fetching workflow jobs...');
    const jobs = await listJobsForWorkflowRun(githubApi);
    // This job always runs, so check if any previous jobs failed and fail this job before doing any more work.
    if (!jobs || jobs.length === 0 || !allWorkflowJobsPassed(jobs[0])) {
      core.setFailed('E2E workflow failed.');
      return exit(1);
    }
    const e2eSteps = listPercyWorkflowSteps(jobs[0]);
    const skippedPercyProjects = e2eSteps
      .filter((step) => step.skipped)
      .map((step) => step.project);

    // Some e2e projects may not have re-run in this workflow run, but we still want to verify them.
    const e2eProjectsToCheck = e2eProjects.filter(
      (project) =>
        !skippedPercyProjects.includes(project) ||
        buildIdFiles.some((file) =>
          file.endsWith(`/percy-build-${project}.txt`),
        ),
    );

    // Log the status of each E2E Visual Review.
    core.info('E2E Visual Review results:');
    let reviewComplete = true;
    let alertWorthy = false;
    const missingScreenshots: {
      project: string;
      removedSnapshots: string[];
    }[] = [];

    for (const e2eProject of e2eProjects) {
      const checkThis = e2eProjectsToCheck.includes(e2eProject);
      let projectStatus: Partial<BuildSummary> = {};

      if (checkThis) {
        // Retrieve build ID from file or logs
        const buildIdResult = await retrieveBuildId(
          e2eProject,
          buildIdFiles,
          jobs,
          githubApi.downloadJobLogs,
          core,
        );

        if (!buildIdResult.buildId) {
          reviewComplete = false;
          alertWorthy = true;
          core.warning(`🚫 ${e2eProject} (unable to retrieve percy build ID)`);
          logDebug(core, `Build ID retrieval failed for ${e2eProject}`, {
            source: buildIdResult.source,
          });
          continue;
        }

        logDebug(core, `Retrieved build ID for ${e2eProject}`, {
          buildId: buildIdResult.buildId,
          source: buildIdResult.source,
        });

        projectStatus = await checkPercyBuild(
          `skyux-${e2eProject}`,
          buildIdResult.buildId,
          core,
          fetchClient,
        );
      }

      // Check if review is complete
      if (
        checkThis &&
        (projectStatus?.state !== 'finished' || !projectStatus?.approved)
      ) {
        reviewComplete = false;
      }

      // Track missing screenshots
      const removedSnapshots = projectStatus?.removedSnapshots ?? [];
      if (!allowMissingScreenshots && removedSnapshots.length > 0) {
        missingScreenshots.push({
          project: e2eProject,
          removedSnapshots,
        });
      }

      // Format and log the build status using the centralized utility
      const { icon, summary } = formatBuildStatus(
        e2eProject,
        {
          state: projectStatus?.state,
          approved: projectStatus?.approved,
          removedSnapshots,
        },
        checkThis,
        allowMissingScreenshots,
      );

      // Track if this status is alert-worthy
      if (checkThis && isAlertWorthy(projectStatus)) {
        alertWorthy = true;
      }

      core.info(`${icon} ${e2eProject} (${summary})`);
    }

    if (missingScreenshots.length > 0) {
      const instructions = `If this is intentional, add the 'screenshot removed' label to this PR and re-run the workflow.`;
      const missingScreenshotMessage = `Projects with missing screenshots:\n${missingScreenshots
        .map(
          (result) =>
            ` * ${result.project}\n${result.removedSnapshots
              .map((s) => `   - ${s}\n`)
              .join('')}`,
        )
        .join(`\n`)}\n${instructions}`;
      const missingScreenshotMessageForSlack = `Projects with missing screenshots: ${missingScreenshots
        .map(
          (result) =>
            ` 👉 ${result.project} (${result.removedSnapshots.join(', ')})`,
        )
        .join(`; `)}. ${instructions}`;
      core.setOutput('missingScreenshots', missingScreenshotMessageForSlack);
      core.setFailed(missingScreenshotMessage);
      return exit(1);
    } else if (!reviewComplete) {
      core.setOutput('shouldAlertSlack', `${alertWorthy}`);
      core.setFailed(`E2E Visual Review not complete.`);
      return exit(1);
    } else {
      core.info('E2E Visual Review passed!');
    }
  } else {
    core.info('No E2E Visual Review to verify.');
  }

  function allWorkflowJobsPassed(jobs: WorkflowJob[]): boolean {
    let allJobsPassed = true;
    const stepFailed = (step: WorkflowJobStep): boolean =>
      !['skipped', 'success'].includes(step.conclusion);
    jobs
      // The job that calls this script.
      .filter((job) => job.name !== 'E2E Visual Review')
      .filter((job) => job.steps.some(stepFailed))
      .forEach((job) => {
        allJobsPassed = false;
        const failStep = job.steps.find(stepFailed);
        core.info(`${job.name}: ${failStep?.name} ${failStep?.conclusion}`);
      });
    return allJobsPassed;
  }

  function listE2eJobsForWorkflowRun(jobs: WorkflowJob[]): WorkflowJob[] {
    return jobs.filter((job: WorkflowJob) =>
      job.name.startsWith('End to end tests'),
    );
  }

  function listPercyWorkflowSteps(jobs: WorkflowJob[]): WorkflowStepSummary[] {
    const workflowE2eJobs = listE2eJobsForWorkflowRun(jobs);

    return workflowE2eJobs
      .filter((job) =>
        job.steps.some((step: WorkflowJobStep) =>
          step.name.startsWith('Percy'),
        ),
      )
      .map((job) =>
        job.steps.find((step: WorkflowJobStep) =>
          step.name.startsWith('Percy'),
        ),
      )
      .filter((step): step is WorkflowJobStep => !!step)
      .map((step) => ({
        project: step.name.replace(/^Percy /, ''),
        skipped: step.conclusion === 'skipped',
        succeeded: step.conclusion === 'success',
      }));
  }

  /**
   * Retrieve build ID from file or logs with improved error tracking
   */
  async function retrieveBuildId(
    e2eProject: string,
    buildIdFiles: string[],
    jobs: WorkflowJob[][],
    downloadJobLogs: (job_id: string) => Promise<string>,
    logger: Logger,
  ): Promise<BuildIdResult> {
    // First, try to read from the build ID file
    const buildIdFile = buildIdFiles.find((file) =>
      file.endsWith(`/percy-build-${e2eProject}.txt`),
    );

    if (buildIdFile && existsSync(buildIdFile)) {
      const buildId = readFileSync(buildIdFile, 'utf-8').trim();
      if (buildId) {
        return { buildId, source: 'file' };
      }
      logDebug(logger, `Build ID file exists but is empty`, {
        project: e2eProject,
        file: buildIdFile,
      });
    }

    // Fall back to reading from logs
    const buildId = await readBuildIdFromLogs(
      e2eProject,
      jobs,
      downloadJobLogs,
    );

    if (buildId) {
      return { buildId, source: 'logs' };
    }

    return { buildId: undefined, source: 'not_found' };
  }

  /**
   * Read build ID from workflow job logs
   */
  async function readBuildIdFromLogs(
    e2eProject: string,
    jobs: WorkflowJob[][],
    downloadJobLogs: (job_id: string) => Promise<string>,
  ): Promise<string | undefined> {
    const jobsForThisProject = jobs
      .flatMap((run) =>
        run.find((job) =>
          job.name.startsWith(`End to end tests (${e2eProject},`),
        ),
      )
      .filter(Boolean) as WorkflowJob[];

    for (const jobForThisProject of jobsForThisProject) {
      const step = jobForThisProject.steps.find((step) =>
        step.name.startsWith('Percy'),
      );
      if (step && step.conclusion === 'success') {
        const log = await downloadJobLogs(jobForThisProject.id);
        const buildId = readPercyBuildNumberFromLogString(log);
        if (buildId) {
          return buildId;
        }
      }
    }
    return undefined;
  }

  async function listJobsForWorkflowRun(githubApi: {
    listJobsForWorkflowRun: () => Promise<WorkflowJob[][]>;
  }): Promise<WorkflowJob[][]> {
    let jobs = await githubApi.listJobsForWorkflowRun();
    if (!jobs || jobs.length === 0 || jobs[0].length === 0) {
      // Retry.
      await new Promise((resolve) => setTimeout(resolve, 20));
      jobs = await githubApi.listJobsForWorkflowRun();
    }
    return jobs;
  }
}
