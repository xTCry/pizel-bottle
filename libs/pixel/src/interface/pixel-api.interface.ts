import { WithLoggerType } from './logger.interface';

export interface PixelApiOptions extends WithLoggerType {
  apiUrl: string;
}

export type PixelResponseData<T> = { response: T };

export interface PixelResponseGetStart {
  /**
   * WebSocket url (`wss://`)
   */
  url: string;
  /**
   * Url (`https://`) for getting the current canvas
   */
  data: string;
  /**
   * Time in milliseconds until **the end** of the battle
   */
  deadline: number;
  /**
   * This warrior can put pixels
   */
  canDraw: boolean;
}
