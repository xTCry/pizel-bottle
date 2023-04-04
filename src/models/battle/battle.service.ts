import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { BattleField, PixelApi, TemplateField } from '@bottle/pixel';

import {
  InjectBattleField,
  InjectBattleOptions,
  InjectTemplateField,
} from '@my-common/decorators';
import { BattleState } from '@bottle/pixel/constants';
import { BattleModuleOptions } from '@my-interfaces';

@Injectable()
export class BattleService implements OnApplicationBootstrap {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectBattleOptions()
    private readonly battleOptions: BattleModuleOptions,
    @InjectBattleField()
    private readonly battleField: BattleField,
    @InjectTemplateField()
    private readonly templateField: TemplateField,
  ) {}

  async onApplicationBootstrap() {
    PixelApi.setOptions(this.battleOptions.optionsPixelApi);

    this.logger.log(`Initializing the Battle...`);

    await this.init();
  }

  private async init() {
    try {
      this.templateField.watchFolder('./dataset/');
      this.templateField.on('pixels', (templatePixels) => {
        this.battleField.templatePixels = templatePixels;
      });
      await this.templateField.loadTemplateField();
      this.battleField.startLoop().then();

      // TODO: load account warriors
    } catch (err) {
      this.logger.error(err);
    }
  }

  public setBattleState(state: BattleState) {
    this.battleField.battleState = state;
  }
}
