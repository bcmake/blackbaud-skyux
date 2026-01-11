import {
  extractBuildIdWithDetails,
  isValidBuildId,
  readPercyBuildNumberFromLogString,
} from './read-build-number-from-logs';

describe('read-build-number-from-logs', () => {
  describe('readPercyBuildNumberFromLogString', () => {
    it('should extract the buildId when the log contains a finalized build line', () => {
      const log = `
Some unrelated log output
Checking for finalized build: [percy] Finalized build #6134: https://percy.io/82a32315/web/skyux-integration-e2e/builds/41420284
More unrelated log output
`;
      expect(readPercyBuildNumberFromLogString(log)).toBe('41420284');
    });

    it('should return undefined when the log does not contain a finalized build line', () => {
      const log = `
Some unrelated log output
No finalized build here
More unrelated log output
`;
      expect(readPercyBuildNumberFromLogString(log)).toBeUndefined();
    });

    it('should extract buildId from URL pattern without full log prefix', () => {
      const log = `
Some log output
https://percy.io/org/project/builds/12345678
More output
`;
      expect(readPercyBuildNumberFromLogString(log)).toBe('12345678');
    });

    it('should return undefined for empty log', () => {
      expect(readPercyBuildNumberFromLogString('')).toBeUndefined();
    });

    it('should return undefined for whitespace-only log', () => {
      expect(readPercyBuildNumberFromLogString('   \n\t  ')).toBeUndefined();
    });
  });

  describe('extractBuildIdWithDetails', () => {
    it('should return success with finalized_log source for full pattern', () => {
      const log =
        '[percy] Finalized build #123: https://percy.io/org/project/builds/99999999';
      const result = extractBuildIdWithDetails(log);
      expect(result.success).toBe(true);
      expect(result.data?.buildId).toBe('99999999');
      expect(result.data?.source).toBe('finalized_log');
    });

    it('should return success with url_pattern source for URL-only pattern', () => {
      const log = 'Build URL: https://percy.io/org/project/builds/88888888';
      const result = extractBuildIdWithDetails(log);
      expect(result.success).toBe(true);
      expect(result.data?.buildId).toBe('88888888');
      expect(result.data?.source).toBe('url_pattern');
    });

    it('should return failure for empty log', () => {
      const result = extractBuildIdWithDetails('');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUILD_ID_NOT_FOUND');
      expect(result.error?.message).toBe('Log content is empty');
    });

    it('should return failure when no build ID found', () => {
      const log = 'Some random log without any Percy build information';
      const result = extractBuildIdWithDetails(log);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUILD_ID_NOT_FOUND');
      expect(result.error?.context).toHaveProperty('logLength');
    });

    it('should include context about what was found in failure', () => {
      const log = 'Log mentions percy.io but no valid build URL';
      const result = extractBuildIdWithDetails(log);
      expect(result.success).toBe(false);
      expect(result.error?.context).toHaveProperty('containsPercyUrl');
    });
  });

  describe('isValidBuildId', () => {
    it('should return true for valid numeric build ID', () => {
      expect(isValidBuildId('12345678')).toBe(true);
    });

    it('should return true for build ID with leading/trailing whitespace', () => {
      expect(isValidBuildId('  12345678  ')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidBuildId('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(isValidBuildId('   ')).toBe(false);
    });

    it('should return false for non-numeric string', () => {
      expect(isValidBuildId('abc123')).toBe(false);
    });

    it('should return false for string with special characters', () => {
      expect(isValidBuildId('123-456')).toBe(false);
    });
  });

  describe('readPercyBuildNumberFromLogFile', () => {
    const mockLog = `
Some unrelated log output
Checking for finalized build: [percy] Finalized build #6134: https://percy.io/82a32315/web/skyux-integration-e2e/builds/41420284
More unrelated log output
`;

    beforeEach(() => {
      jest.resetModules();
    });

    it('should extract the buildId from a log file', () => {
      jest.mock('node:fs', () => ({
        readFileSync: jest.fn(() => mockLog),
      }));
      // Re-import after mocking
      const {
        readPercyBuildNumberFromLogFile,
      } = require('./read-build-number-from-logs');
      expect(readPercyBuildNumberFromLogFile('fake/path/to/log.txt')).toBe(
        '41420284',
      );
    });

    it('should handle an error', () => {
      jest.mock('node:fs', () => ({
        readFileSync: jest.fn(() => {
          throw new Error('File not found');
        }),
      }));
      // Re-import after mocking
      const {
        readPercyBuildNumberFromLogFile,
      } = require('./read-build-number-from-logs');
      expect(
        readPercyBuildNumberFromLogFile('fake/path/to/log.txt'),
      ).toBeUndefined();
    });
  });

  describe('readPercyBuildNumberFromLogFileWithDetails', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should return success with file path for valid log file', () => {
      const mockLog =
        '[percy] Finalized build #123: https://percy.io/org/project/builds/77777777';
      jest.mock('node:fs', () => ({
        readFileSync: jest.fn(() => mockLog),
      }));
      const {
        readPercyBuildNumberFromLogFileWithDetails,
      } = require('./read-build-number-from-logs');
      const result =
        readPercyBuildNumberFromLogFileWithDetails('test/path.log');
      expect(result.success).toBe(true);
      expect(result.data?.buildId).toBe('77777777');
      expect(result.data?.filePath).toBe('test/path.log');
    });

    it('should return failure for file read error', () => {
      jest.mock('node:fs', () => ({
        readFileSync: jest.fn(() => {
          throw new Error('ENOENT: no such file');
        }),
      }));
      const {
        readPercyBuildNumberFromLogFileWithDetails,
      } = require('./read-build-number-from-logs');
      const result =
        readPercyBuildNumberFromLogFileWithDetails('nonexistent.log');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUILD_ID_NOT_FOUND');
      expect(result.error?.context).toHaveProperty('filePath');
    });

    it('should return failure for non-Error thrown value', () => {
      jest.mock('node:fs', () => ({
        readFileSync: jest.fn(() => {
          throw 'string error';
        }),
      }));
      const {
        readPercyBuildNumberFromLogFileWithDetails,
      } = require('./read-build-number-from-logs');
      const result =
        readPercyBuildNumberFromLogFileWithDetails('nonexistent.log');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUILD_ID_NOT_FOUND');
      expect(result.error?.context).toHaveProperty('originalError');
    });

    it('should return failure for file without build ID', () => {
      jest.mock('node:fs', () => ({
        readFileSync: jest.fn(() => 'No build ID in this file'),
      }));
      const {
        readPercyBuildNumberFromLogFileWithDetails,
      } = require('./read-build-number-from-logs');
      const result = readPercyBuildNumberFromLogFileWithDetails('empty.log');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUILD_ID_NOT_FOUND');
    });
  });
});
