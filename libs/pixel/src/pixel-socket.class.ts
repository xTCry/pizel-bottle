import * as WebSocket from 'ws';
import { LoadingState, MessageType, PixelFlag } from './constants';
import { pushToFile } from './tools';

import { PixelApi } from './pixel-api.class';
import { PixelReader } from './pixel-reader.class';
import { Pixel } from './pixel.class';
import { Warrior } from './warrior.class';

export class PixelSocket {
  public connected: boolean = false;
  private ws: WebSocket = null;

  public reader = new PixelReader(this.battleField);

  /**
   * После какого времени (unix timestamp) снова может воевать
   */
  private onlineWait: number = 0;
  /**
   * Сколько ms длится перезагрузка на пиксель (ждать 1 минуту)
   */
  private onlineTtl: number = 60e3;

  /**
   * Счетчик промахов
   */
  private missesCounter: number = 0;

  /**
   * Количество попыток подключиться (решение "капчи")
   */
  private retryCooldown = 0;
  /**
   * Через сколько мс повторное подключение
   */
  private retryTime = 1e3;
  /**
   * Таймаут таймера повторного подключения
   */
  private retryTimer: NodeJS.Timeout = null;
  /**
   * Таймаут таймера жизни (ping)
   */
  private aliveTimer: NodeJS.Timeout = null;
  /**
   * Таймаут таймера убийцы на безответный ping
   */
  private killTimer: NodeJS.Timeout = null;

  /**
   * Arsenal
   */
  public readonly arsenal = { bomb: 0, freeze: 0, pixel: 0, singlePixel: 0 };

  constructor(
    private readonly warrior: Warrior,
    private _connectionAddress: string = null,
  ) {}

  public get connectionAddress() {
    return this._connectionAddress;
  }

  public async run(wsUrl?: string) {
    this.close();

    if (wsUrl) {
      this._connectionAddress = wsUrl;
    }

    if (!this.connectionAddress) {
      this.warrior.logger.error('Not ws connection address');
      return false;
    }

    try {
      this.ws = new WebSocket(this.connectionAddress, {
        headers: {
          origin: `https://${PixelApi.getHost(this.warrior.embedUrl)}`,
        },
      });

      this.ws.onopen = () => {
        return this.onOpen();
      };

      this.ws.onerror = (event) => {
        this.log.error('WS Error', event.message);
        return this.reconnect();
      };

      this.ws.onclose = () => {
        this.log.debug('Connection closed');
        this.reconnect();
      };

      this.ws.onmessage = (e) => {
        this.resetAliveTimer();

        if ('pong' === e.data) {
          return;
        }

        if ('restart' === e.data) {
          this.retryTime = 1e3 * Math.random() + 5e3;
          this.log.debug('I am offline');
          return;
        }

        if (typeof e.data === 'string') {
          if (
            'DOUBLE_CONNECT' === e.data ||
            e.data.startsWith('BAD_CLIENT') ||
            e.data.startsWith('NO_ARGS')
          ) {
            this.connected = false;
            // ? close connection

            this.retryTime = null;
            this.log.error('Error WS', e.data);
            return;
          }

          try {
            let payload = JSON.parse(e.data);
            this.dispatch(payload);
          } catch (err) {
            this.log.error(err);
            this.log.debug('ftw payload data', e.data);
          }
        } else if (this.warrior.isMainListener) {
          try {
            if (
              !this.reader
                .bisy /* 0 === this.reader.readyState || 2 === this.reader.readyState */
            ) {
              this.reader.readAsArrayBuffer(e.data);
            } else {
              this.reader.toRead.push(e.data);

              if (this.reader.toRead.length > 1e4) {
                this.log.error('Force set bisy false');
                this.reader.bisy = false;
              }
            }
          } catch (err) {
            this.reader.toRead.push(e.data);
            this.log.error(err);
          }
        }
      };
    } catch (err) {
      this.log.error(err);
      this.reconnect();
    }

    return true;
  }

  protected onOpen() {
    this.connected = true;
    this.retryTime = 1e3;
    this.battleField.checkMWSL(this.warrior.userId);

    this.resetAliveTimer();

    // * Init load original main field
    if (
      this.warrior.isMainListener &&
      this.battleField.originalFieldLoadingState !== LoadingState.LOADED &&
      this.battleField.originalFieldLoadingState !== LoadingState.LOADING
    ) {
      this.battleField.loadFieldData(this.warrior).then();
    }
  }

  public reconnect() {
    clearTimeout(this.retryTimer);
    this.connected = false;
    // this.ws = null;

    if (!this.retryTime || this.retryCooldown > 0) {
      return;
    }

    this.onlineWait = Date.now() + 59e3;
    this.retryTimer = setTimeout(() => {
      this.run();
      this.retryCooldown++;
    }, this.retryTime + 1e3);
    this.retryTime *= 1.3;
  }

  public close(withoutRetry: boolean = false) {
    if (withoutRetry) {
      this.retryTime = 0;
    }

    this.connected = false;
    clearTimeout(this.aliveTimer);
    clearTimeout(this.killTimer);

    this.battleField.checkMWSL(this.warrior.userId);

    if (this.ws) {
      try {
        this.ws.close();
        this.ws = null;
      } catch (e) {
        this.log.error('Error close', e);
      }
    }
  }

  /**
   * Проверка на работоспособность - если этот метод не был вызван, значит что-то не так с сетью.
   * Потому что сервер явно шлет пакеты каждую секунду. Если этого не произошло,
   * то попытка пинга сервера, иначе переподключение.
   */
  public resetAliveTimer() {
    clearTimeout(this.aliveTimer);
    clearTimeout(this.killTimer);

    this.aliveTimer = setTimeout(() => {
      this.sendDebug('ping');
      this.killTimer = setTimeout(() => {
        this.close();
        this.log.debug('Kill tick');
      }, 2e3);
    }, 2e3);
  }

  public resetWait() {
    this.onlineWait = 0;
  }

  protected dispatch(payload: { v: any; t: number }) {
    switch (payload.t) {
      case MessageType.MESSAGE_TYPE_BATCH: {
        for (const e of payload.v) {
          this.dispatch(e);
        }
        break;
      }

      case MessageType.MESSAGE_TYPE_SCORE: {
        const { bomb, freeze, pixel, singlePixel, debug, usageLost } =
          payload.v as {
            bomb: number;
            freeze: number;
            pixel: number;
            singlePixel: number;
            debug: boolean;
            usageLost: number;
          };
        if (bomb !== this.arsenal.bomb) {
          this.log.debug('[SCORE!] bomb: ', bomb);
        }
        if (freeze !== this.arsenal.freeze) {
          this.arsenal.freeze = freeze;
          this.log.debug('[SCORE!] freeze: ', freeze);
        }
        if (pixel !== this.arsenal.pixel) {
          this.arsenal.pixel = pixel;
          this.log.debug('[SCORE!] pixel: ', pixel);
        }
        if (singlePixel !== this.arsenal.singlePixel) {
          this.arsenal.singlePixel = singlePixel;
          this.log.debug('[SCORE!] singlePixel: ', singlePixel);
        }
        // this.store.dispatch(Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.z)(bomb, freeze, pixel, singlePixel, usageLost));

        // this.debug('MESSAGE_TYPE_SCORE: ', payload.v);
        if (debug !== undefined) {
          // this.debug('WS Debug: ', debug);
        }
        break;
      }

      case MessageType.MESSAGE_TYPE_ONLINE: {
        this.retryCooldown--;
        this.updateOnline(payload.v);
        break;
      }

      case MessageType.MESSAGE_TYPE_RELOAD: {
        if (parseInt(payload.v, 10) > MessageType.V) {
          this.close();
        }
        break;
      }

      case MessageType.MESSAGE_TYPE_GIFT_LINK: {
        this.log.info('Event gift:', payload.v);
        break;
      }

      case MessageType.MESSAGE_TYPE_DEADLINE: {
        clearTimeout(this.aliveTimer);
        clearTimeout(this.killTimer);
        break;
      }

      case MessageType.MESSAGE_TYPE_PROMOCODE: {
        const promocode = payload.v as {
          type: string;
          title: string;
          shortDescription: string;
          longDescription: string;
          // "2023-04-15"
          expiresAt: string;
          // "XXX-XXX-X0X0-X0X0"
          value: string;
          // "https://vk.com/promocode"
          url: string;
        };
        this.log.info('Promocode: ', promocode);
        pushToFile(
          'promocode.stat',
          `${Date.now()}::${this.warrior.userId}::${JSON.stringify(promocode)}`,
        );

        break;
      }

      default: {
        this.log.debug('Unknown message type ' + payload.t, payload.v);
      }
    }
  }

  protected updateOnline(data: {
    code?;
    online?;
    ttl?: number;
    wait?: number;
    deadline?: number;
  }) {
    const { code, online, ttl, wait, deadline } = data;

    if (online !== undefined) {
      this.battleField.sayOnline(online);
      if (this.warrior.isMainListener) {
        pushToFile('online.stat', `${Date.now()}::${online}`);
      }
    }

    if (ttl !== undefined) {
      this.onlineTtl = ttl /* / 1e3 | 0 */;
    }

    if (wait !== undefined && wait > 0) {
      this.log.debug('wait:', wait);
      // this._wait = Math.ceil(wait / 1e3);
      this.onlineWait = Date.now() + wait;
    }

    if (deadline !== undefined) {
      // * Game end.
      if (deadline < 0) {
        clearTimeout(this.aliveTimer);
        clearTimeout(this.killTimer);
      }
    }

    if (code) {
      this.log.debug('Evaling code:', code);
      // const newCode = OmyEval(code);
      // try {
      //   this.sendDebug(`R${parseInt(newCode)}`);
      // } catch (e) {}
    }
  }

  protected sendDebug(
    e: string | ArrayBuffer | SharedArrayBuffer | ArrayBufferView,
  ) {
    if (!this.ws) {
      return;
    }

    this.log.debug('WS sendDebug: ', e);
    this.ws.send(e);
  }

  public sendPixel(pixel: Pixel) {
    if (!this.ws) {
      this.log.error('HelloMthrFcr #1');
      return;
    }

    if (!this.isAlive) {
      this.log.debug('I am tried');
      return;
    }

    try {
      let buff = new ArrayBuffer(4);
      new Int32Array(buff, 0, 1)[0] = pixel.pack();
      this.ws.send(buff);
      // this.log.debug('WS send: ', pixel.toString());
      this.onlineWait = Date.now() + this.onlineTtl;
      this.resetAliveTimer();
    } catch (err) {
      this.log.error('sendPixel error', err);
    }

    // TODO: отключаться от сокета на минуту?

    if (this.battleField.options.healthCheckActive !== false) {
      const watcherTimer = setTimeout(() => {
        // Могут быть миссклики, когда область хорошо обороняют
        if (!this.battleField.pingPixel(pixel)) {
          ++this.missesCounter;
          this.log.debug('I am alive? (Pixel not ping)', this.missesCounter);
          // this.battleField.unsetPixel(pixel);
          this.battleField.unsetTempPixel(pixel);

          if (this.missesCounter > 6) {
            this.log.error('Warrior resigned');
            this.close(true);
            return;
          }

          if (!true) {
            // Лучше не сбрасывать,
            // т.к. при попытке поставить пиксель при идущем таймере - дисконнект
            this.resetWait();
          }
        } else if (this.missesCounter > 0) {
          this.missesCounter -= 2;
        }
      }, 10e3);
      this.battleField.watchPixel(pixel, watcherTimer);
    }

    if (pixel.flag === PixelFlag.BOMB) {
      for (const pxl of Pixel.createExplode(pixel.x, pixel.y, {})) {
        if (!this.battleField.isFreeze(pxl.x, pxl.y)) {
          this.battleField.addTempPixel(pxl);
        }
      }
    } else if (pixel.flag === PixelFlag.FREZE) {
      const freezPixels = Pixel.createFreeze(pixel.x, pixel.y, {});
      const timeToFreez = Date.now() + Pixel.FREEZE_TIME + 200;
      for (const pxl of freezPixels) {
        this.battleField.freezePixel(pxl, timeToFreez);
      }
      this.battleField.setTimerForUpdateFreeze(timeToFreez);
    } else {
      this.battleField.addTempPixel(pixel);
    }
  }

  /**
   * Send buffer pixel
   * @param pixels Pixels array
   * @deprecated Not working
   */
  public sendBufferPixel(pixels: Pixel[]) {
    let buff = new ArrayBuffer(4 * pixels.length);
    let arr = new Int32Array(buff, 0, pixels.length);

    pixels.forEach((pixel, i) => {
      arr[i] = pixel.pack();
    });

    try {
      this.ws.send(buff);
    } catch (err) {
      this.log.error('Send BufferPixel error', err);
    }
  }

  public get isAlive() {
    return this.onlineWait - Date.now() < 1;
  }

  protected get battleField() {
    return this.warrior.battleField;
  }

  protected get log() {
    return this.warrior.logger;
  }
}
