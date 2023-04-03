import { ModuleMetadata, Type } from '@nestjs/common';
import {
  BattleFieldOptions,
  PixelApiOptions,
  TemplateFieldOptions,
} from '@bottle/pixel/interface';

export interface BattleModuleOptions {
  // token: string;
  optionsPixelApi: PixelApiOptions;
  optionsBattleField: BattleFieldOptions;
  optionsTemplateField: TemplateFieldOptions;
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
