import { Inject } from '@nestjs/common';
import { PIZEL_BOTTLE_BATTLE_OPTIONS } from '@my-common/constants';

export const InjectBattleOptions = (): ParameterDecorator =>
  Inject(PIZEL_BOTTLE_BATTLE_OPTIONS);
