import { Provider } from '@nestjs/common';
import {
  PIZEL_BOTTLE_BATTLE_OPTIONS,
  PIZEL_BOTTLE_PIXEL_API,
} from '@my-common';
import { BattleModuleOptions } from '@my-interfaces/battle-options.interface';
import { PixelApi } from '@bottle/pixel';

export const pixelApiProvider: Provider = {
  provide: PIZEL_BOTTLE_PIXEL_API,
  useFactory: (options: BattleModuleOptions) =>
    new PixelApi(options.optionsPixelApi),
  inject: [PIZEL_BOTTLE_BATTLE_OPTIONS],
};
