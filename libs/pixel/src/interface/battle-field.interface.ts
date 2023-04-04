import { Logger, WithLoggerType } from './logger.interface';

export interface BattleFieldOptions extends WithLoggerType {
  healthCheckActive?: boolean;
  logOnlineToConsole?: boolean;
  warriorLogger?: Logger;
}
