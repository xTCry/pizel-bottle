import { Logger, BattleFieldOptions } from './interface';
import { getLogger } from './logger';

export class BattleField {
  protected readonly logger: Logger;

  constructor(protected options: BattleFieldOptions) {
    this.logger = getLogger(options);
    //
  }
}
