import { BattleFieldOptions, PixelApiOptions } from '@bottle/pixel/interface';
import { ModuleMetadata, Type } from '@nestjs/common';

export interface BattleModuleOptions {
  // token: string;
  optionsPixelApi: PixelApiOptions;
  optionsBattleField: BattleFieldOptions;
}

export interface BattleOptionsFactory {
  createBattleOptions(): Promise<BattleModuleOptions> | BattleModuleOptions;
}

export interface BattleModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<BattleOptionsFactory>;
  useClass?: Type<BattleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<BattleModuleOptions> | BattleModuleOptions;
  inject?: any[];
}
