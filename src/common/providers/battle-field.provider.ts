import { Provider } from '@nestjs/common';
import {
  PIZEL_BOTTLE_BATTLE_OPTIONS,
  PIZEL_BOTTLE_BATTLE_FIELD,
} from '@my-common/constants';
import { BattleModuleOptions } from '@my-interfaces/battle-options.interface';
import { BattleField } from '@bottle/pixel';

export const battleFieldProvider: Provider = {
  provide: PIZEL_BOTTLE_BATTLE_FIELD,
  useFactory: (options: BattleModuleOptions) =>
    new BattleField(options.optionsBattleField),
  inject: [PIZEL_BOTTLE_BATTLE_OPTIONS],
};
