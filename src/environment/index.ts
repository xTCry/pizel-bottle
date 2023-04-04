import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';

const env = dotenv.config();
dotenvExpand.expand(env);

export enum EnvType {
  DEV = 'development',
  PROD = 'production',
  TEST = 'testing',
}

// * Environment
export const NODE_ENV: EnvType =
  (process.env.NODE_ENV as EnvType) || EnvType.DEV;

export const LOG_PATH: string = process.env.LOG_PATH || './logs/';

// * Application
export const SERVER_PORT: number = +process.env.SERVER_PORT || 3000;
export const DOMAIN: string = process.env.DOMAIN || '127.0.0.1';
export const API_URL: string =
  process.env.API_URL || `http://localhost:${SERVER_PORT}`;
export const USE_LOCALHOST: boolean = process.env.USE_LOCALHOST
  ? process.env.USE_LOCALHOST === 'true'
  : false;

export const PIXEL_BATTLE_API_URL: string =
  process.env.PIXEL_BATTLE_API_URL || 'https://pixel-dev.w84.vkforms.ru';

export const TEMPLATE_IMAGE: string =
  process.env.TEMPLATE_IMAGE || './dataset/template.png';

export const USE_SMART_COLOR_SEARCH: boolean = process.env
  .USE_SMART_COLOR_SEARCH
  ? process.env.USE_SMART_COLOR_SEARCH === 'true'
  : false;

export const USE_LOGGING_ONLINE: boolean = process.env.USE_LOGGING_ONLINE
  ? process.env.USE_LOGGING_ONLINE === 'true'
  : false;

export const USE_HEALTH_CHECK: boolean = process.env.USE_HEALTH_CHECK
  ? process.env.USE_HEALTH_CHECK === 'true'
  : false;

export const USE_AUTO_UPDATE_FIELD: boolean = process.env.USE_AUTO_UPDATE_FIELD
  ? process.env.USE_AUTO_UPDATE_FIELD === 'true'
  : false;

export const USE_AUTO_LOAD_EMBEDS: boolean = process.env.USE_AUTO_LOAD_EMBEDS
  ? process.env.USE_AUTO_LOAD_EMBEDS === 'true'
  : false;
