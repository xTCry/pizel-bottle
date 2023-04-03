import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PixelApi, TemplateField } from '@bottle/pixel';

import { InjectPixelApi, InjectTemplateField } from '@my-common/decorators';

@Injectable()
export class BattleService implements OnApplicationBootstrap {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectTemplateField()
    private readonly templateField: TemplateField,
    @InjectPixelApi()
    private readonly pixelApi: PixelApi,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log(`Initializing the Battle...`);

    await this.init();
  }

  private async init() {
    // this.templateField
    // ...
  }
}
