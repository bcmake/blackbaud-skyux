import {
  PercyError,
  PercyErrorCode,
  success,
  failure,
  withRetry,
  sleep,
  isNetworkError,
  isRetryableError,
  toPercyError,
  logError,
  logWarning,
  logDebug,
  containsRetryableError,
  logContainsFinalizedBuild,
  logContainsSuccessExit,
  validatePercyToken,
  formatBuildStatus,
  isAlertWorthy,
  RETRYABLE_ERROR_PATTERNS,
} from './percy-error';

describe('percy-error', () => {
  describe('PercyError', () => {
    it('should create an error with code and message', () => {
      const error = new PercyError(
        PercyErrorCode.API_ERROR,
        'Test error message',
      );
      expect(error.code).toBe(PercyErrorCode.API_ERROR);
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('PercyError');
      expect(error.context).toEqual({});
    });

    it('should create an error with context', () => {
      const error = new PercyError(
        PercyErrorCode.BUILD_NOT_FOUND,
        'Build not found',
        { buildId: '123', project: 'test' },
      );
      expect(error.context).toEqual({ buildId: '123', project: 'test' });
    });

    it('should format error for logging without context', () => {
      const error = new PercyError(PercyErrorCode.API_ERROR, 'Test error');
      expect(error.toLogString()).toBe('[PERCY_API_ERROR] Test error');
    });

    it('should format error for logging with context', () => {
      const error = new PercyError(PercyErrorCode.API_ERROR, 'Test error', {
        key: 'value',
      });
      expect(error.toLogString()).toBe(
        '[PERCY_API_ERROR] Test error Context: {"key":"value"}',
      );
    });
  });

  describe('success and failure', () => {
    it('should create a successful result', () => {
      const result = success({ data: 'test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'test' });
      expect(result.error).toBeUndefined();
    });

    it('should create a failed result', () => {
      const error = new PercyError(PercyErrorCode.API_ERROR, 'Test error');
      const result = failure(error);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe(error);
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return result on first successful attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const resultPromise = withRetry(operation, { maxAttempts: 3 });
      await jest.runAllTimersAsync();
      const result = await resultPromise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      const onRetry = jest.fn();
      const resultPromise = withRetry(operation, {
        maxAttempts: 3,
        delayMs: 100,
        onRetry,
      });
      await jest.runAllTimersAsync();
      const result = await resultPromise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should throw after max attempts', async () => {
      jest.useRealTimers();
      const operation = jest.fn().mockRejectedValue(new Error('fail'));
      const resultPromise = withRetry(operation, {
        maxAttempts: 3,
        delayMs: 10,
      });
      await expect(resultPromise).rejects.toThrow('fail');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry if shouldRetry returns false', async () => {
      jest.useRealTimers();
      const operation = jest.fn().mockRejectedValue(new Error('fail'));
      const resultPromise = withRetry(operation, {
        maxAttempts: 3,
        delayMs: 10,
        shouldRetry: () => false,
      });
      await expect(resultPromise).rejects.toThrow('fail');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should apply backoff multiplier', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      const resultPromise = withRetry(operation, {
        maxAttempts: 3,
        delayMs: 100,
        backoffMultiplier: 2,
      });
      await jest.runAllTimersAsync();
      const result = await resultPromise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should resolve after specified time', async () => {
      const sleepPromise = sleep(1000);
      jest.advanceTimersByTime(1000);
      await expect(sleepPromise).resolves.toBeUndefined();
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network errors', () => {
      expect(isNetworkError(new Error('network error'))).toBe(true);
      expect(isNetworkError(new Error('fetch failed'))).toBe(true);
      expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isNetworkError(new Error('timeout'))).toBe(true);
      expect(isNetworkError(new Error('ENOTFOUND'))).toBe(true);
    });

    it('should return false for non-network errors', () => {
      expect(isNetworkError(new Error('some other error'))).toBe(false);
      expect(isNetworkError('string error')).toBe(false);
      expect(isNetworkError(null)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      expect(isRetryableError(new Error('network error'))).toBe(true);
    });

    it('should return true for retryable Percy errors', () => {
      expect(
        isRetryableError(
          new PercyError(PercyErrorCode.NETWORK_ERROR, 'Network error'),
        ),
      ).toBe(true);
      expect(
        isRetryableError(
          new PercyError(PercyErrorCode.API_ERROR, 'API error'),
        ),
      ).toBe(true);
    });

    it('should return false for non-retryable Percy errors', () => {
      expect(
        isRetryableError(
          new PercyError(PercyErrorCode.TOKEN_MISSING, 'Token missing'),
        ),
      ).toBe(false);
    });

    it('should return false for other errors', () => {
      expect(isRetryableError(new Error('some error'))).toBe(false);
    });
  });

  describe('toPercyError', () => {
    it('should return the same error if already a PercyError', () => {
      const error = new PercyError(PercyErrorCode.API_ERROR, 'Test');
      expect(toPercyError(error)).toBe(error);
    });

    it('should convert Error to PercyError', () => {
      const error = new Error('Test error');
      const percyError = toPercyError(error);
      expect(percyError).toBeInstanceOf(PercyError);
      expect(percyError.message).toBe('Test error');
      expect(percyError.code).toBe(PercyErrorCode.API_ERROR);
    });

    it('should convert network Error to PercyError with NETWORK_ERROR code', () => {
      const error = new Error('network failed');
      const percyError = toPercyError(error);
      expect(percyError.code).toBe(PercyErrorCode.NETWORK_ERROR);
    });

    it('should convert string to PercyError', () => {
      const percyError = toPercyError('string error');
      expect(percyError.message).toBe('string error');
    });

    it('should use provided default code', () => {
      const error = new Error('Test');
      const percyError = toPercyError(error, PercyErrorCode.BUILD_NOT_FOUND);
      expect(percyError.code).toBe(PercyErrorCode.BUILD_NOT_FOUND);
    });

    it('should include provided context', () => {
      const error = new Error('Test');
      const percyError = toPercyError(error, PercyErrorCode.API_ERROR, {
        key: 'value',
      });
      expect(percyError.context['key']).toBe('value');
    });
  });

  describe('logging functions', () => {
    const createLogger = () => ({
      debug: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      notice: jest.fn(),
      info: jest.fn(),
    });

    describe('logError', () => {
      it('should log error message', () => {
        const logger = createLogger();
        logError(logger, new Error('Test error'));
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Test error'),
        );
      });

      it('should include context in log', () => {
        const logger = createLogger();
        logError(logger, new Error('Test error'), { key: 'value' });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('key'),
        );
      });
    });

    describe('logWarning', () => {
      it('should log warning message', () => {
        const logger = createLogger();
        logWarning(logger, 'Warning message');
        expect(logger.warning).toHaveBeenCalledWith('Warning message');
      });

      it('should include context in log', () => {
        const logger = createLogger();
        logWarning(logger, 'Warning message', { key: 'value' });
        expect(logger.warning).toHaveBeenCalledWith(
          'Warning message Context: {"key":"value"}',
        );
      });
    });

    describe('logDebug', () => {
      it('should log debug message', () => {
        const logger = createLogger();
        logDebug(logger, 'Debug message');
        expect(logger.debug).toHaveBeenCalledWith('Debug message');
      });

      it('should include context in log', () => {
        const logger = createLogger();
        logDebug(logger, 'Debug message', { key: 'value' });
        expect(logger.debug).toHaveBeenCalledWith(
          'Debug message Context: {"key":"value"}',
        );
      });
    });
  });

  describe('log pattern matching', () => {
    describe('containsRetryableError', () => {
      it('should return true for retryable error patterns', () => {
        RETRYABLE_ERROR_PATTERNS.forEach((pattern) => {
          expect(containsRetryableError(`Some log ${pattern} more log`)).toBe(
            true,
          );
        });
      });

      it('should return false for non-retryable logs', () => {
        expect(containsRetryableError('Normal log output')).toBe(false);
      });
    });

    describe('logContainsFinalizedBuild', () => {
      it('should return true when log contains finalized build', () => {
        const log = `
Some output
[percy] Finalized build #123: https://percy.io/...
More output
`;
        expect(logContainsFinalizedBuild(log)).toBe(true);
      });

      it('should return false when log does not contain finalized build', () => {
        expect(logContainsFinalizedBuild('Normal log output')).toBe(false);
      });
    });

    describe('logContainsSuccessExit', () => {
      it('should return true when log contains success exit', () => {
        const log = 'Process exited with status: 0';
        expect(logContainsSuccessExit(log)).toBe(true);
      });

      it('should return false when log does not contain success exit', () => {
        expect(logContainsSuccessExit('Process exited with status: 1')).toBe(
          false,
        );
      });
    });
  });

  describe('validatePercyToken', () => {
    it('should return success for valid token', () => {
      const result = validatePercyToken('valid-token', 'test-project');
      expect(result.success).toBe(true);
      expect(result.data).toBe('valid-token');
    });

    it('should return failure for empty token', () => {
      const result = validatePercyToken('', 'test-project');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(PercyErrorCode.TOKEN_MISSING);
    });

    it('should return failure for undefined token', () => {
      const result = validatePercyToken(undefined, 'test-project');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(PercyErrorCode.TOKEN_MISSING);
    });

    it('should return failure for whitespace-only token', () => {
      const result = validatePercyToken('   ', 'test-project');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(PercyErrorCode.TOKEN_MISSING);
    });

    it('should trim valid token', () => {
      const result = validatePercyToken('  valid-token  ', 'test-project');
      expect(result.success).toBe(true);
      expect(result.data).toBe('valid-token');
    });
  });

  describe('formatBuildStatus', () => {
    it('should return "percy build not needed" when not checking', () => {
      const result = formatBuildStatus('project', {}, false, true);
      expect(result).toEqual({ icon: '🙈', summary: 'percy build not needed' });
    });

    it('should return "missing screenshots" when not allowed and present', () => {
      const result = formatBuildStatus(
        'project',
        { removedSnapshots: ['snap1', 'snap2'] },
        true,
        false,
      );
      expect(result).toEqual({
        icon: '❌',
        summary: 'missing screenshots: snap1, snap2',
      });
    });

    it('should return "approved" for finished and approved', () => {
      const result = formatBuildStatus(
        'project',
        { state: 'finished', approved: true },
        true,
        true,
      );
      expect(result).toEqual({ icon: '✅', summary: 'approved' });
    });

    it('should return "needs approval" for finished but not approved', () => {
      const result = formatBuildStatus(
        'project',
        { state: 'finished', approved: false },
        true,
        true,
      );
      expect(result).toEqual({ icon: '⚠️', summary: 'needs approval' });
    });

    it('should return "in progress" for waiting/pending/processing states', () => {
      ['waiting', 'pending', 'processing'].forEach((state) => {
        const result = formatBuildStatus('project', { state }, true, true);
        expect(result).toEqual({ icon: '⏳', summary: 'in progress' });
      });
    });

    it('should return "failed" for failed state', () => {
      const result = formatBuildStatus(
        'project',
        { state: 'failed' },
        true,
        true,
      );
      expect(result).toEqual({ icon: '❌', summary: 'failed' });
    });

    it('should return "no Percy build found" for undefined state', () => {
      const result = formatBuildStatus(
        'project',
        { state: undefined },
        true,
        true,
      );
      expect(result).toEqual({ icon: '🚫', summary: 'no Percy build found' });
    });

    it('should return unknown state message for other states', () => {
      const result = formatBuildStatus(
        'project',
        { state: 'unknown' },
        true,
        true,
      );
      expect(result).toEqual({ icon: '❓', summary: 'Percy state: "unknown"' });
    });
  });

  describe('isAlertWorthy', () => {
    it('should return true for finished but not approved', () => {
      expect(isAlertWorthy({ state: 'finished', approved: false })).toBe(true);
    });

    it('should return false for finished and approved', () => {
      expect(isAlertWorthy({ state: 'finished', approved: true })).toBe(false);
    });

    it('should return true for failed state', () => {
      expect(isAlertWorthy({ state: 'failed' })).toBe(true);
    });

    it('should return true for undefined state', () => {
      expect(isAlertWorthy({ state: undefined })).toBe(true);
    });

    it('should return false for in-progress states', () => {
      expect(isAlertWorthy({ state: 'waiting' })).toBe(false);
      expect(isAlertWorthy({ state: 'pending' })).toBe(false);
      expect(isAlertWorthy({ state: 'processing' })).toBe(false);
    });

    it('should return true for unknown states', () => {
      expect(isAlertWorthy({ state: 'unknown' })).toBe(true);
    });
  });
});
