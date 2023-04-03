import { Inject } from '@nestjs/common';
import { PIZEL_BOTTLE_BATTLE_FIELD } from '@my-common/constants';

export const InjectBattleField = (): ParameterDecorator =>
  Inject(PIZEL_BOTTLE_BATTLE_FIELD);
