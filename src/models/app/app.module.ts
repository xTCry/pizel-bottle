import { Module } from '@nestjs/common';
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
            embedUrl: 'helloW',
            // ...
          },
          optionsBattleField: {
            logger: createNestLogger('BattleField'),
            // ...
          },
          optionsTemplateField: {
            logger: createNestLogger('TemplateField'),
            // ...
          },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
