import { readFileSync } from 'node:fs';

import {
  PercyError,
  PercyErrorCode,
  PercyResult,
  failure,
  success,
} from './percy-error';

/**
 * Regex pattern to extract Percy build ID from finalized build log line
 * Matches: [percy] Finalized build #123: https://percy.io/.../builds/12345678
 * The URL can have variable path segments before /builds/
 * Examples:
 *   - https://percy.io/org/project/builds/12345678
 *   - https://percy.io/82a32315/web/skyux-integration-e2e/builds/41420284
 * Captures the build number at the end of the URL
 */
const PERCY_BUILD_ID_PATTERN =
  /\[percy\] Finalized build #\d+: https:\/\/percy\.io\/.*\/builds\/(\d+)/;

/**
 * Alternative pattern for build URLs without the full log prefix
 * Matches: https://percy.io/.../builds/12345678
 * The URL can have variable path segments before /builds/
 */
const PERCY_BUILD_URL_PATTERN = /https:\/\/percy\.io\/.*\/builds\/(\d+)/;

/**
 * Result type for build ID extraction
 */
export interface BuildIdExtractionResult {
  buildId: string;
  source: 'finalized_log' | 'url_pattern';
}

/**
 * Extract Percy build ID from a log string using regex patterns
 *
 * This function uses multiple patterns to extract the build ID:
 * 1. First tries the full "[percy] Finalized build" pattern
 * 2. Falls back to extracting from any Percy build URL
 *
 * @param log - The log content to search
 * @returns The build ID if found, undefined otherwise
 */
export function readPercyBuildNumberFromLogString(
  log: string,
): string | undefined {
  const result = extractBuildIdWithDetails(log);
  return result.success ? result.data?.buildId : undefined;
}

/**
 * Extract Percy build ID with detailed result information
 *
 * @param log - The log content to search
 * @returns A result object with the build ID and extraction source
 */
export function extractBuildIdWithDetails(
  log: string,
): PercyResult<BuildIdExtractionResult> {
  if (!log || log.trim() === '') {
    return failure(
      new PercyError(
        PercyErrorCode.BUILD_ID_NOT_FOUND,
        'Log content is empty',
        { logLength: 0 },
      ),
    );
  }

  // Try the primary pattern first (full finalized build line)
  const primaryMatch = log.match(PERCY_BUILD_ID_PATTERN);
  if (primaryMatch?.[1]) {
    const buildId = primaryMatch[1].trim();
    if (isValidBuildId(buildId)) {
      return success({ buildId, source: 'finalized_log' });
    }
  }

  // Fall back to URL pattern
  const urlMatch = log.match(PERCY_BUILD_URL_PATTERN);
  if (urlMatch?.[1]) {
    const buildId = urlMatch[1].trim();
    if (isValidBuildId(buildId)) {
      return success({ buildId, source: 'url_pattern' });
    }
  }

  return failure(
    new PercyError(
      PercyErrorCode.BUILD_ID_NOT_FOUND,
      'No Percy build ID found in log',
      {
        logLength: log.length,
        containsFinalizedBuild: log.includes('[percy] Finalized build'),
        containsPercyUrl: log.includes('percy.io'),
      },
    ),
  );
}

/**
 * Validate that a build ID is in the expected format
 *
 * @param buildId - The build ID to validate
 * @returns true if the build ID is valid
 */
export function isValidBuildId(buildId: string): boolean {
  if (!buildId || buildId.trim() === '') {
    return false;
  }

  // Build IDs should be numeric strings
  const trimmed = buildId.trim();
  return /^\d+$/.test(trimmed) && trimmed.length > 0;
}

/**
 * Read Percy build ID from a log file
 *
 * @param logFilePath - Path to the log file
 * @returns The build ID if found, undefined otherwise
 */
export function readPercyBuildNumberFromLogFile(
  logFilePath: string,
): string | undefined {
  const result = readPercyBuildNumberFromLogFileWithDetails(logFilePath);
  return result.success ? result.data?.buildId : undefined;
}

/**
 * Read Percy build ID from a log file with detailed result information
 *
 * @param logFilePath - Path to the log file
 * @returns A result object with the build ID and extraction details
 */
export function readPercyBuildNumberFromLogFileWithDetails(
  logFilePath: string,
): PercyResult<BuildIdExtractionResult & { filePath: string }> {
  try {
    const logContent = readFileSync(logFilePath, 'utf-8');
    const result = extractBuildIdWithDetails(logContent);

    if (result.success && result.data) {
      return success({
        ...result.data,
        filePath: logFilePath,
      });
    }

    return failure(
      new PercyError(
        PercyErrorCode.BUILD_ID_NOT_FOUND,
        `No Percy build ID found in log file: ${logFilePath}`,
        {
          filePath: logFilePath,
          originalError: result.error?.message,
        },
      ),
    );
  } catch (error) {
    return failure(
      new PercyError(
        PercyErrorCode.BUILD_ID_NOT_FOUND,
        `Error reading log file: ${logFilePath}`,
        {
          filePath: logFilePath,
          originalError: error instanceof Error ? error.message : String(error),
        },
      ),
    );
  }
}
