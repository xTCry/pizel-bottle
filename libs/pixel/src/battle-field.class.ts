import axios from 'axios';
import {
  BattleState,
  colorIndexDecode,
  LoadingState,
  PixelFlag,
} from './constants';
import { Logger, BattleFieldOptions, VkUserAnyAuth } from './interface';
import { delay } from './tools';
import { getLogger } from './logger';
import { Pixel } from './pixel.class';
import { Warrior } from './warrior.class';
import { PixelApi } from './pixel-api.class';

export class BattleField {
  protected readonly logger: Logger;

  // public healthCheck: HealthCheck = new HealthCheck();

  /**
   * Набор наблюдаемых пикселей, которые ставят воины.
   */
  private watchedPixels: Map<Pixel['hash4watch'], number> = new Map();

  /**
   * Набор воинов (аккаунтов)
   */
  public warriors: Map<number, Warrior> = new Map();

  /**
   * ID главного слушателя сокета
   */
  public mainListenerId: number = null;

  /**
   * Текущие изменения всего поля получаемые через WebSocket
   */
  public mainCanvas: Record<number, number> = {};

  // /**
  //  * Цвета со смещениями (позиции пикселей) отрисовываемого полотна
  //  */
  // public templateCanvas: Record<number, number> = {};

  /**
   * Отрисовываемые пиксели (Загруженное изображение)
   */
  public templatePixels: Record<number, Pixel> = {};
  // public arPixels: Pixel[] = [];

  private freeezedPixels: Record<number, number> = {};
  /**
   * Набор таймаутов замороженных пикселей
   */
  private freezeTimers: Record<number, NodeJS.Timeout> = {};
  private freezeOverdraw: Record<number, Pixel[]> = {};
  private updatesPixel: Pixel[] = [];

  /**
   * Состояние загрузки оригинального полотна
   */
  public originalFieldLoadingState: LoadingState = LoadingState.NONE;

  /**
   * Состояние битвы на поле
   */
  public battleState: BattleState = BattleState.NONE;

  /**
   * Url на получение текущего полотна
   */
  public dataUrl: string = null;

  public loopDelay: number = 3e3;

  private lastSayOnline = 0;
  private lastUpdateFieldDataTime = 0;

  constructor(public readonly options: BattleFieldOptions) {
    this.logger = getLogger(options);
  }

  public async startLoop() {
    const loop = async () => {
      try {
        if (
          this.options.autoUpdateField &&
          Date.now() - this.lastUpdateFieldDataTime > 1 * 60e3 &&
          this.originalFieldLoadingState !== LoadingState.LOADING &&
          this.connectedWarriors.size === 0
        ) {
          this.loadFieldData().then();
        }

        if (this.battleState !== BattleState.DRAWING) {
          await delay(this.loopDelay);
          setImmediate(loop);
          return;
        }

        const aliveWarriors = this.aliveWarriors;
        if (!aliveWarriors.size) {
          // TODO: сделать расчет до ближайшего выхода в бой
          await delay(this.loopDelay);
          setImmediate(loop);
          return;
        }

        // this.logger.info('[LOOP] aliveWarriors', aliveWarriors.size);

        const warriors = aliveWarriors.entries();

        const arPixels = Object.values(this.templatePixels);
        const pixels = arPixels.sort(
          () => Math.random() - 0.5,
        ); /* .sort((a, b) => (rand(0, 10) > 6 ? 1 : b.importance - a.importance)) */

        for (const pixel of pixels) {
          if (
            this.mainCanvas[pixel.offset] === pixel.colorId ||
            this.isFreeze(pixel.x, pixel.y)
          ) {
            continue;
          }

          const { value, done } = warriors.next();
          if (done) {
            this.logger.info('Warriors ended, waiting for new...');
            break;
          }
          const [, warrior] = value as [number, Warrior];

          warrior.pixelSocket.sendPixel(pixel);
          warrior.logger.debug('Try draw', pixel.toString());
          this.mainCanvas[pixel.offset] = pixel.colorId;

          await delay(50);
        }
      } catch (err) {
        this.logger.error(err);
      }

      await delay(this.loopDelay * Math.random() + 5e3);
      setImmediate(loop);
    };
    await loop();
  }

  public async addWarrior(auth: VkUserAnyAuth) {
    const warrior = Warrior.createByAuth(this, auth);
    const loaded = await warrior.start();

    if (!loaded) {
      this.logger.warn(`Failed start @${warrior.userId}`);
      return null;
    }

    if (this.warriors.has(warrior.userId)) {
      this.logger.warn(`This warrior already added @${warrior.userId}`);
      return null;
    }

    warrior.logger.debug('Is ready');
    this.warriors.set(warrior.userId, warrior);

    return warrior;
  }

  /**
   * Попытка установить Id главного слушателя сокета (check Main WebSocket Listener)
   */
  public checkMWSL(userId: number) {
    // * Ессли это текущий и он не подключен
    if (
      this.mainListenerId == userId &&
      this.warriors.has(userId) &&
      !this.warriors.get(userId).connected
    ) {
      this.mainListenerId = null;
      for (const [userId, acc] of this.warriors.entries()) {
        if (acc.connected) {
          this.mainListenerId = userId;
          return true;
        }
      }
    }

    // * Этот активен и он стал главным
    if (
      userId < this.warriors.size &&
      this.warriors.has(userId) &&
      this.warriors.get(userId).connected
    ) {
      this.mainListenerId = userId;
      return true;
    }

    // * Если ничего не остается как этот
    if (
      !this.mainListenerId ||
      (this.warriors.has(this.mainListenerId) &&
        !this.warriors.get(this.mainListenerId).connected)
    ) {
      this.mainListenerId = userId;
      return true;
    }

    return false;
  }

  /**
   * Заргузить текущее состояние поля
   * @param warrior От какого Воина делать обращение
   */
  public async loadFieldData(warrior?: Warrior) {
    this.originalFieldLoadingState = LoadingState.LOADING;
    this.lastUpdateFieldDataTime = Date.now();

    try {
      this.logger.info(/* .green */ 'Try load original field');
      const data = await this.fetchFieldData(warrior);
      const pixelsData = data.substr(0, Pixel.MAX_WIDTH * Pixel.MAX_HEIGHT);

      for (let y = 0; y < Pixel.MAX_HEIGHT; y++) {
        for (let x = 0; x < Pixel.MAX_WIDTH; x++) {
          const colorId = colorIndexDecode[pixelsData[y * Pixel.MAX_WIDTH + x]];
          this.onNewPixel(Pixel.create({ x, y, colorId }));
        }
      }

      this.logger /* .green */
        .info('Origin field loaded');

      const pixelsFreez = data.substr(Pixel.MAX_WIDTH * Pixel.MAX_HEIGHT);

      if (pixelsFreez) {
        try {
          const freezAr = JSON.parse(pixelsFreez) as [number, number][];
          for (const data of freezAr) {
            if (!Array.isArray(data) || data.length < 1) {
              return;
            }

            const [offsetData, timeToFreez] = data;
            const { x, y } = Pixel.unOffset(offsetData);

            // console.log('Freez', { x, y }, timeToFreez);

            for (const pxl of Pixel.createFreeze(x, y)) {
              this.freeezedPixels[Pixel.offset(pxl.x, pxl.y)] = timeToFreez;
            }
            this.setTimerForUpdateFreeze(timeToFreez);
          }
        } catch (err) {
          console.error(err);
        }
      }

      for (const pixel of this.updatesPixel) {
        this.drawPixel(pixel);
      }
    } catch (err) {
      this.logger.error('Failed laod main field', err);
      // warrior?.pixelSocket.reconnect();
      this.originalFieldLoadingState = LoadingState.NONE;
      return false;
    }

    this.updatesPixel = [];
    this.originalFieldLoadingState = LoadingState.LOADED;

    return true;
  }

  private async fetchFieldData(
    warrior?: Warrior,
    rety: number = 0,
  ): Promise<string> {
    const retryTime = 2;
    const url = `${
      this.dataUrl || `${PixelApi.apiUrl}/api/data`
    }?ts=${new Date().getMinutes()}-${new Date().getHours()}`;

    try {
      const response = await (warrior ? warrior.api : axios).get<string>(url);

      if (response.status !== 200) {
        if (rety < retryTime) {
          await delay(1e3 * Math.random() + 100);
          return this.fetchFieldData(warrior, rety + 1);
        }

        throw new Error(`Bad status (${response.status}) for data url: ${url}`);
      }

      const data = String(response.data);
      this.logger.info('Data field size', data.length);

      if (data.length >= Pixel.MAX_WIDTH * Pixel.MAX_HEIGHT) {
        return data;
      }

      if (rety < retryTime) {
        await delay(1e3 * Math.random() + 100);
        return this.fetchFieldData(warrior, rety + 1);
      }

      throw new Error(
        `Bad response length, expect: ${
          Pixel.MAX_WIDTH * Pixel.MAX_HEIGHT
        } got ${data.length}`,
      );
    } catch (err) {
      this.originalFieldLoadingState = LoadingState.ERROR;
      throw new Error(`fetch bitmap data from ${url} error: ${err.message}`);
    }
  }

  public onNewPixel(pixel: Pixel) {
    const pixelHash = pixel.hash4watch;
    if (this.watchedPixels.has(pixelHash)) {
      this.warriors
        .get(this.watchedPixels.get(pixelHash))
        .logger.debug('[Pixel] Pinged', pixel.toString());
      this.watchedPixels.delete(pixelHash);
    }

    if (this.isFreeze(pixel.x, pixel.y)) {
      if (!this.freezeOverdraw[pixel.offset]) {
        this.freezeOverdraw[pixel.offset] = [];
      }
      this.freezeOverdraw[pixel.offset].push(pixel);
    } else {
      if (this.originalFieldLoadingState === LoadingState.LOADED) {
        this.drawPixel(pixel);
      } else {
        this.updatesPixel.push(pixel);
      }
      // this.overDrawDot(pixel) &&
      //   PixelFlag.NONE === pixel.flag &&
      //   this.store.dispatch(
      //     Object(_modules_EventList__WEBPACK_IMPORTED_MODULE_11__.m)(pixel),
      //   );
    }

    if (
      pixel.flag === PixelFlag.FREZE ||
      pixel.flag === PixelFlag.FREZE_CENTER
    ) {
      let timeMs = Date.now() + Pixel.FREEZE_TIME;
      this.freeezedPixels[pixel.offset] = timeMs;
      this.setTimerForUpdateFreeze(timeMs);
    }
  }

  public watchPixel(pixel: Pixel, userId: number) {
    this.watchedPixels.set(pixel.hash4watch, userId);
  }

  public pingPixel(pixel: Pixel) {
    const pixelHash = pixel.hash4watch;
    if (this.watchedPixels.has(pixelHash)) {
      this.watchedPixels.delete(pixelHash);
      return false;
    }
    return true;
  }

  public drawPixel(pixel: Pixel) {
    this.mainCanvas[pixel.offset] = pixel.colorId;
  }

  public unsetPixel(pixel: Pixel) {
    this.mainCanvas[pixel.offset] = -1;
  }

  /**
   * Установка замороженого пикселя на полотне
   * @param timeMs
   */
  public setTimerForUpdateFreeze(timeMs: number) {
    const timerId = timeMs - (timeMs % 1e3) + 1e3;
    if (this.freezeTimers[timerId]) {
      return;
    }

    this.freezeTimers[timerId] = setTimeout(() => {
      delete this.freezeTimers[timerId];

      const nowMs = Date.now();
      let pixelOffsets = [];

      for (const pixelOffset of Object.keys(this.freeezedPixels)) {
        if (this.freeezedPixels[pixelOffset] <= nowMs) {
          pixelOffsets.push(pixelOffset);
        }
      }

      for (const pixelOffset of pixelOffsets) {
        delete this.freeezedPixels[pixelOffset];

        if (this.freezeOverdraw[pixelOffset]) {
          // log.debug('Freeze overdraw:', pixelOffset);
          for (const pixel of this.freezeOverdraw[pixelOffset]) {
            this.drawPixel(pixel);
          }
        }
        delete this.freezeOverdraw[pixelOffset];
      }
    }, Math.max(timerId - Date.now(), 500));
  }

  public isFreeze(x: number, y: number) {
    return this.freeezedPixels[Pixel.offset(x, y)] > Date.now();
  }

  public freeze(x: number, y: number, timeToFreez: number) {
    this.freeezedPixels[Pixel.offset(x, y)] = timeToFreez;
  }

  public freezePixel(pixel: Pixel, timeToFreez: number) {
    this.freeezedPixels[pixel.offset] = timeToFreez;
  }

  public sayOnline(usersOnline: number) {
    if (
      this.options.logOnlineToConsole &&
      Date.now() - this.lastSayOnline > 30e3
    ) {
      this.logger
        /* .bgDarkGray */ .debug(`Online: ${usersOnline} users`);
      // this.drawStatus();
      this.lastSayOnline = Date.now();
    }
  }

  public get stats() {
    return {
      warriors: {
        total: this.warriors.size,
        connected: this.connectedWarriors.size,
        alive: this.aliveWarriors.size,
      },
    };
  }

  public get aliveWarriors() {
    return new Map(
      [...this.warriors.entries()].filter(
        ([, acc]) =>
          acc.connected && acc.pixelSocket.isAlive && !acc.isMainListener,
      ),
    );
  }

  public get connectedWarriors() {
    return new Map(
      [...this.warriors.entries()].filter(([, acc]) => acc.connected),
    );
  }

  public get warriorLogger() {
    return this.options.warriorLogger;
  }
}
