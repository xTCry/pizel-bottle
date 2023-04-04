import { Module } from '@nestjs/common';
import * as xEnv from '@my-environment';
import { createNestLogger } from '@my-common/utils/logger.util';

import { BattleModule } from '../battle/battle.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    BattleModule.forRootAsync({
      useFactory: async () => {
        return {
          optionsPixelApi: {
            logger: createNestLogger('PixelApi'),
            apiUrl: xEnv.PIXEL_BATTLE_API_URL,
          },
          optionsBattleField: {
            logger: createNestLogger('BattleField'),
            warriorLogger: createNestLogger('Warrior'),
            logOnlineToConsole: xEnv.USE_LOGGING_ONLINE,
            healthCheckActive: xEnv.USE_HEALTH_CHECK,
            autoUpdateField: xEnv.USE_AUTO_UPDATE_FIELD,
            autoLoadEmbeds: xEnv.USE_AUTO_LOAD_EMBEDS,
          },
          optionsTemplateField: {
            logger: createNestLogger('TemplateField'),
            urlToImage: xEnv.TEMPLATE_IMAGE,
            smartColorSearch: xEnv.USE_SMART_COLOR_SEARCH,
          },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
