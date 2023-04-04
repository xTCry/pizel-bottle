import { AxiosInstance } from 'axios';

import { LoadingState } from './constants';
import {
  PixelResponseData,
  PixelResponseGetStart,
  VkUserAnyAuth,
} from './interface';
import { delay } from './tools';

import { PixelApi } from './pixel-api.class';
import { PixelSocket } from './pixel-socket.class';
import { BattleField } from './battle-field.class';

export class Warrior {
  public readonly api: AxiosInstance;
  public readonly pixelSocket: PixelSocket;

  public readonly userId: number;

  public loadingState: LoadingState = LoadingState.NONE;

  constructor(
    public readonly battleField: BattleField,
    public readonly embedUrl: string,
    public realGroupId?: number,
  ) {
    this.api = PixelApi.createApi(embedUrl);
    this.userId = PixelApi.getUserId(embedUrl);
    this.pixelSocket = new PixelSocket(this);
  }

  public static createByAuth(battleField: BattleField, auth: VkUserAnyAuth) {
    let embedUrl = ('embedUrl' in auth && auth.embedUrl) || null;
    if (!embedUrl && 'login' in auth && auth.login && auth.password) {
      // TODO: Get token (auth vk)
      // auth.token = '...'
    }
    if (!embedUrl && 'token' in auth && auth.token) {
      // TODO: Get embedUrl by token
    }

    if (!embedUrl) {
      throw new Error('Empty embedUrl');
    }

    return new Warrior(battleField, embedUrl);
  }

  public async start(retry: number = 0) {
    if (this.connected) {
      this.logger.debug('Already connected');
      return false;
    }

    this.loadingState = LoadingState.LOADING;

    try {
      const {
        data: { response },
      } = await this.api.get<PixelResponseData<PixelResponseGetStart>>(
        'start',
        {
          params: {
            view: 0,
          },
        },
      );
      let { url, data, deadline } = response;

      // this.logger.debug('Response server URL:', JSON.stringify(url));

      /* or only main */
      this.battleField.dataUrl = data;

      if (deadline < 0) {
        this.logger /* .red */
          .info('The end.');

        // this.loadField().then();
      } else {
        await this.pixelSocket.run(PixelApi.prepareWsUrl(this.embedUrl, url));
      }
    } catch (err) {
      this.loadingState = LoadingState.ERROR;
      this.logger.error('User load error', err.message);

      if (retry < 2) {
        await delay(1e3);
        return this.start(++retry);
      }

      return false;
    }

    return true;
  }

  public get logger() {
    const logger = this.battleField.warriorLogger;
    if ('vkUserId' in logger && typeof logger.vkUserId === 'function') {
      return logger.vkUserId(this.userId) as typeof logger;
    }
    return logger;
  }

  public get isMainListener() {
    return this.battleField.mainListenerId === this.userId;
  }

  public get connected() {
    return this.pixelSocket.connected;
  }
}
