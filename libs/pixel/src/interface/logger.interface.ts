import * as ololog from 'ololog';

export type Logger =
  | Pick<Console, 'info' | 'warn' | 'error' | 'debug'>
  | ololog;

export type WithLoggerType = { logger?: Logger };
