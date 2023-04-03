import { Inject } from '@nestjs/common';
import { PIZEL_BOTTLE_TEMPLATE_FIELD } from '@my-common/constants';

export const InjectTemplateField = (): ParameterDecorator =>
  Inject(PIZEL_BOTTLE_TEMPLATE_FIELD);
