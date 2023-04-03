import { Inject } from '@nestjs/common';
import { PIZEL_BOTTLE_PIXEL_API } from '@my-common/constants';

export const InjectPixelApi = (): ParameterDecorator =>
  Inject(PIZEL_BOTTLE_PIXEL_API);
