import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { BattleField, PixelApi, TemplateField } from '@bottle/pixel';

import {
  InjectBattleField,
  InjectBattleOptions,
  InjectTemplateField,
} from '@my-common/decorators';
import { BattleState } from '@bottle/pixel/constants';
import { BattleModuleOptions } from '@my-interfaces';
import { pushToFile } from '@my-common/utils/fs.util';
import { loadEmbeds } from '@my-common/utils/ini-loader.util';

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

      if (this.battleOptions.optionsBattleField.autoLoadEmbeds) {
        let embedsData = await loadEmbeds();
        let embeds = [...embedsData];

        const warroirs = await Promise.all(
          embeds
            .filter(Boolean)
            .map((embedUrl) => this.battleField.addWarrior({ embedUrl })),
        );
        this.logger.log(`Loaded ${warroirs.length}/${embeds.length} Warroirs`);
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  public async saveEmbeds(embedUrls: string[]) {
    const lastEmbeds = await loadEmbeds();
    embedUrls = embedUrls
      .map((e) => e.trim())
      .filter((e) => !lastEmbeds.includes(e));
    if (embedUrls.length === 0) {
      return;
    }
    await pushToFile('embeds.ini', embedUrls.join('\n'));
  }

  public setBattleState(state: BattleState) {
    this.battleField.battleState = state;
  }
}
