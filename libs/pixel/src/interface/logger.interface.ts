export type Logger = Pick<Console, 'info' | 'warn' | 'error'>;

export type WithLoggerType = { logger?: Logger };
