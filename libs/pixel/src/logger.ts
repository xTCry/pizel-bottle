import { Logger, WithLoggerType } from './interface/logger.interface';

/**
 * Compatibility matrix
 *
  | Library  |  log  |  info  | warn  |  error  | \<interpolation\> |
  |----------|:------|:-------|:------|:--------|:------------------|
  | console  |   ✅   |  ✅   |   ✅   |   ✅    |   ✅ (%s %o %O)   |
  | bunyan   |   ❌   |  ✅   |   ✅   |   ✅    |   ✅ (%s %o %O)   |
  | pino     |   ❌   |  ✅   |   ✅   |   ✅    |   ✅ (%s %o %O)   |
  | winston  |   ❌   |  ✅   |   ✅   |   ✅    |   ✅ (%s %o %O)^1 |
  | log4js   |   ❌   |  ✅   |   ✅   |   ✅    |   ✅ (%s %o %O)   |
 *
 * ^1: https://github.com/winstonjs/winston#string-interpolation
 */
const noopLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

export function getLogger(options: Record<any, any> & WithLoggerType): Logger {
  return options.logger || noopLogger;
}
