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

// * Application
export const SERVER_PORT: number = +process.env.SERVER_PORT || 3000;
export const DOMAIN: string = process.env.DOMAIN || '127.0.0.1';
export const API_URL: string =
  process.env.API_URL || `http://localhost:${SERVER_PORT}`;
export const USE_LOCALHOST: boolean = process.env.USE_LOCALHOST
  ? process.env.USE_LOCALHOST === 'true'
  : false;
