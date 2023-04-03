import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { BattleField, PixelApi, TemplateField } from '@bottle/pixel';

import {
  InjectBattleField,
  InjectPixelApi,
  InjectTemplateField,
} from '@my-common/decorators';

@Injectable()
export class BattleService implements OnApplicationBootstrap {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectBattleField()
    private readonly battleField: BattleField,
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
    try {
      await this.templateField.loadTemplateField();
    } catch (err) {
      this.logger.error(err);
    }
  }
}
