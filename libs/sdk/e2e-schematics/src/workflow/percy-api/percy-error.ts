import { Logger } from '../verify-e2e/verify-e2e';

/**
 * Error codes for Percy operations
 */
export enum PercyErrorCode {
  API_ERROR = 'PERCY_API_ERROR',
  BUILD_ID_NOT_FOUND = 'BUILD_ID_NOT_FOUND',
  BUILD_NOT_FOUND = 'BUILD_NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  TOKEN_MISSING = 'TOKEN_MISSING',
  RETRY_EXHAUSTED = 'RETRY_EXHAUSTED',
}

/**
 * Custom error class for Percy operations
 */
export class PercyError extends Error {
  public readonly code: PercyErrorCode;
  public readonly context: Record<string, unknown>;

  constructor(
    code: PercyErrorCode,
    message: string,
    context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'PercyError';
    this.code = code;
    this.context = context;
  }

  /**
   * Format the error for logging
   */
  public toLogString(): string {
    const contextStr =
      Object.keys(this.context).length > 0
        ? ` Context: ${JSON.stringify(this.context)}`
        : '';
    return `[${this.code}] ${this.message}${contextStr}`;
  }
}

/**
 * Result type for operations that can fail
 */
export interface PercyResult<T> {
  success: boolean;
  data?: T;
  error?: PercyError;
}

/**
 * Create a successful result
 */
export function success<T>(data: T): PercyResult<T> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function failure<T>(error: PercyError): PercyResult<T> {
  return { success: false, error };
}

/**
 * Options for retry operations
 */
export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

/**
 * Execute an async operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  let currentDelay = opts.delayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxAttempts) {
        break;
      }

      const shouldRetry = opts.shouldRetry?.(error) ?? true;
      if (!shouldRetry) {
        break;
      }

      opts.onRetry?.(attempt, error);

      await sleep(currentDelay);
      currentDelay *= opts.backoffMultiplier ?? 1;
    }
  }

  throw lastError;
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('econnrefused') ||
      message.includes('timeout') ||
      message.includes('enotfound')
    );
  }
  return false;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) {
    return true;
  }

  if (error instanceof PercyError) {
    return [
      PercyErrorCode.NETWORK_ERROR,
      PercyErrorCode.API_ERROR,
    ].includes(error.code);
  }

  return false;
}

/**
 * Create a PercyError from an unknown error
 */
export function toPercyError(
  error: unknown,
  defaultCode: PercyErrorCode = PercyErrorCode.API_ERROR,
  context: Record<string, unknown> = {},
): PercyError {
  if (error instanceof PercyError) {
    return error;
  }

  if (error instanceof Error) {
    const code = isNetworkError(error) ? PercyErrorCode.NETWORK_ERROR : defaultCode;
    return new PercyError(code, error.message, {
      ...context,
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new PercyError(defaultCode, String(error), context);
}

/**
 * Log an error with appropriate severity
 */
export function logError(
  logger: Logger,
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  const percyError = toPercyError(error, PercyErrorCode.API_ERROR, context);
  logger.error(percyError.toLogString());
}

/**
 * Log a warning
 */
export function logWarning(
  logger: Logger,
  message: string,
  context: Record<string, unknown> = {},
): void {
  const contextStr =
    Object.keys(context).length > 0
      ? ` Context: ${JSON.stringify(context)}`
      : '';
  logger.warning(`${message}${contextStr}`);
}

/**
 * Log debug information
 */
export function logDebug(
  logger: Logger,
  message: string,
  context: Record<string, unknown> = {},
): void {
  const contextStr =
    Object.keys(context).length > 0
      ? ` Context: ${JSON.stringify(context)}`
      : '';
  logger.debug(`${message}${contextStr}`);
}

/**
 * Patterns for retryable errors in Percy logs
 */
export const RETRYABLE_ERROR_PATTERNS = [
  'This is likely a client error',
  'Error: Can only finalize pending builds',
  'Module loop: this module is already being loaded',
  'Failed to connect to the bus: Could not parse server address: Unknown address type',
];

/**
 * Check if a log contains retryable errors
 */
export function containsRetryableError(log: string): boolean {
  return RETRYABLE_ERROR_PATTERNS.some((pattern) => log.includes(pattern));
}

/**
 * Pattern for detecting finalized build in logs
 */
export const FINALIZED_BUILD_PATTERN = /^\[percy] Finalized build/m;

/**
 * Pattern for detecting successful exit in logs
 */
export const SUCCESS_EXIT_PATTERN = / exited with status: 0$/m;

/**
 * Check if a log indicates a finalized build
 */
export function logContainsFinalizedBuild(log: string): boolean {
  return FINALIZED_BUILD_PATTERN.test(log);
}

/**
 * Check if a log indicates successful exit
 */
export function logContainsSuccessExit(log: string): boolean {
  return SUCCESS_EXIT_PATTERN.test(log);
}

/**
 * Validate Percy token
 */
export function validatePercyToken(
  token: string | undefined,
  project: string,
): PercyResult<string> {
  if (!token || token.trim() === '') {
    return failure(
      new PercyError(
        PercyErrorCode.TOKEN_MISSING,
        `Percy token is not set for project ${project}`,
        { project },
      ),
    );
  }
  return success(token.trim());
}

/**
 * Format a build status message
 */
export function formatBuildStatus(
  project: string,
  status: {
    state?: string;
    approved?: boolean;
    removedSnapshots?: string[];
  },
  checkThis: boolean,
  allowMissingScreenshots: boolean,
): { icon: string; summary: string } {
  const removedSnapshots = status.removedSnapshots ?? [];

  if (!checkThis) {
    return { icon: '🙈', summary: 'percy build not needed' };
  }

  if (!allowMissingScreenshots && removedSnapshots.length > 0) {
    return {
      icon: '❌',
      summary: `missing screenshots: ${removedSnapshots.join(', ')}`,
    };
  }

  if (status.state === 'finished' && status.approved) {
    return { icon: '✅', summary: 'approved' };
  }

  if (status.state === 'finished' && !status.approved) {
    return { icon: '⚠️', summary: 'needs approval' };
  }

  if (['waiting', 'pending', 'processing'].includes(status.state ?? '')) {
    return { icon: '⏳', summary: 'in progress' };
  }

  if (status.state === 'failed') {
    return { icon: '❌', summary: 'failed' };
  }

  if (typeof status.state === 'undefined') {
    return { icon: '🚫', summary: 'no Percy build found' };
  }

  return { icon: '❓', summary: `Percy state: "${status.state}"` };
}

/**
 * Determine if a build status is alert-worthy
 */
export function isAlertWorthy(status: {
  state?: string;
  approved?: boolean;
}): boolean {
  if (status.state === 'finished' && !status.approved) {
    return true;
  }
  if (status.state === 'failed') {
    return true;
  }
  if (typeof status.state === 'undefined') {
    return true;
  }
  if (!['finished', 'waiting', 'pending', 'processing'].includes(status.state ?? '')) {
    return true;
  }
  return false;
}
