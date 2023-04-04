import { Provider } from '@nestjs/common';
import {
  PIZEL_BOTTLE_BATTLE_OPTIONS,
  PIZEL_BOTTLE_TEMPLATE_FIELD,
} from '@my-common';
import { BattleModuleOptions } from '@my-interfaces/battle-options.interface';
import { TemplateField } from '@bottle/pixel';

export const templateFieldProvider: Provider = {
  provide: PIZEL_BOTTLE_TEMPLATE_FIELD,
  useFactory: (options: BattleModuleOptions) =>
    new TemplateField(options.optionsTemplateField),
  inject: [PIZEL_BOTTLE_BATTLE_OPTIONS],
};
