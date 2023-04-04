import { Logger, WithLoggerType } from './logger.interface';

export interface BattleFieldOptions extends WithLoggerType {
  warriorLogger?: Logger;
  healthCheckActive?: boolean;
  logOnlineToConsole?: boolean;
  autoUpdateField?: boolean;
  autoLoadEmbeds?: boolean;
}
