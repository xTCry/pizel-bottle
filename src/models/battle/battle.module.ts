import {
  DynamicModule,
  Global,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import {
  BattleModuleAsyncOptions,
  BattleOptionsFactory,
} from '@my-interfaces/battle-options.interface';
import {
  battleFieldProvider,
  pixelApiProvider,
  templateFieldProvider,
} from '@my-common/providers';
import { PIZEL_BOTTLE_BATTLE_OPTIONS } from '@my-common';

import { BattleService } from './battle.service';

@Global()
@Module({
  imports: [],
  providers: [BattleService],
})
export class BattleModule implements OnApplicationShutdown {
  public static forRootAsync(options: BattleModuleAsyncOptions): DynamicModule {
    const providers = [
      battleFieldProvider,
      pixelApiProvider,
      templateFieldProvider,
    ];

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: BattleModule,
      imports: options.imports,
      providers: [...asyncProviders, ...providers],
      exports: providers,
    };
  }

  private static createAsyncProviders(
    options: BattleModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    const useClass = options.useClass as Type<BattleOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: BattleModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: PIZEL_BOTTLE_BATTLE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = [options.useClass || options.useExisting];
    return {
      provide: PIZEL_BOTTLE_BATTLE_OPTIONS,
      useFactory: async (optionsFactory: BattleOptionsFactory) =>
        await optionsFactory.createBattleOptions(),
      inject,
    };
  }

  async onApplicationShutdown(signal?: string) {
    // const war = this.moduleRef.get<...>('name');
    // TODO: safe stop war
  }
}
