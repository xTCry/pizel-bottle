import { Module } from '@nestjs/common';

import { BattleModule } from '../battle/battle.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    BattleModule.forRootAsync({
      useFactory: async () => ({
        optionsPixelApi: {
          embedUrl: 'helloW',
        },
        optionsBattleField: {
          // ...
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
