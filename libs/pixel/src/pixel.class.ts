import * as hash from 'object-hash';
import { ColorId, PixelFlag } from './constants';
import { toInt } from './tools';

export class Pixel {
  static MAX_WIDTH = 1590;
  static MAX_HEIGHT = 400;
  static MIN_COLOR_ID = 0;
  static MAX_COLOR_ID = 25;

  static SIZE = Pixel.MAX_WIDTH * Pixel.MAX_HEIGHT;

  static BOMB = 1;
  static FREZE = 2;
  static PIXEL = 3;
  static FREZE_CENTER = 4;
  static RELOAD_CHAT = 5;
  static BOMB_CENTER = 7;
  static PIXEL_START = 8;
  static FLAG_PIXEL = 9;

  static FREEZE_TIME = 3e4;
  static EXPLORE_COLOR = 4;
  static LOCK_TIME = 15e3;
  static LOCK_COUNT = 30;

  static colorMap = [
    '#FFFFFF',
    '#C2C2C2',
    '#858585',
    '#474747',
    '#000000',
    '#3AAFFF',
    '#71AAEB',
    '#4a76a8',
    '#074BF3',
    '#5E30EB',
    '#FF6C5B',
    '#FE2500',
    '#FF218B',
    '#99244F',
    '#4D2C9C',
    '#FFCF4A',
    '#FEB43F',
    '#FE8648',
    '#FF5B36',
    '#DA5100',
    '#94E044',
    '#5CBF0D',
    '#C3D117',
    '#FCC700',
    '#D38301',
  ];

  static colorMapByteArray = Pixel.colorMap.map((e) => {
    const r = e.substr(1, 2);
    const g = e.substr(3, 2);
    const b = e.substr(5, 2);
    return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)] as const;
  });

  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly colorId: ColorId,
    public readonly flag: PixelFlag,
    public readonly userId: number,
    public readonly groupId: number,
    public readonly importance: number = 255,
    public readonly ts: number,
  ) {}

  public static create({
    x,
    y,
    colorId,
    userId,
    groupId,
    flag = 0,
    importance,
  }: {
    x: number;
    y: number;
    colorId: ColorId;
    userId?: number;
    groupId?: number;
    flag?: number;
    importance?: number;
  }) {
    const pixel = new Pixel(
      toInt(x),
      toInt(y),
      toInt(colorId) as ColorId,
      toInt(flag, PixelFlag.NONE),
      toInt(userId, null),
      toInt(groupId, null),
      toInt(importance, 255),
      Date.now(),
    );

    return pixel;
  }

  //
  public static findColorIdByColor(color: [number, number, number]) {
    return Pixel.colorMapByteArray.findIndex(
      (e) => e[0] === color[0] && e[1] === color[1] && e[2] === color[2],
    );
  }

  public static offset(x: number, y: number): number {
    return y * Pixel.MAX_WIDTH + x;
  }

  public static unOffset(index: number) {
    return {
      x: index % Pixel.MAX_WIDTH,
      y: Math.floor(index / Pixel.MAX_WIDTH),
    };
  }

  public static createExplode(
    x: number,
    y: number,
    userData: { id?: number; groupId?: number } = {},
  ) {
    const params = {
      userId: userData.id,
      groupId: userData.groupId,
      flag: PixelFlag.BOMB,
    };
    return [
      Pixel.create({
        x: x,
        y: y,
        colorId: 11,
        ...params,
      }),
      Pixel.create({
        x: x,
        y: y + 1,
        colorId: 16,
        ...params,
      }),
      Pixel.create({
        x: x,
        y: y - 1,
        colorId: 16,
        ...params,
      }),
      Pixel.create({
        x: x + 1,
        y: y,
        colorId: 16,
        ...params,
      }),
      Pixel.create({
        x: x + 1,
        y: y + 1,
        colorId: 15,
        ...params,
      }),
      Pixel.create({
        x: x + 1,
        y: y - 1,
        colorId: 15,
        ...params,
      }),
      Pixel.create({
        x: x - 1,
        y: y,
        colorId: 16,
        ...params,
      }),
      Pixel.create({
        x: x - 1,
        y: y + 1,
        colorId: 15,
        ...params,
      }),
      Pixel.create({
        x: x - 1,
        y: y - 1,
        colorId: 15,
        ...params,
      }),
      Pixel.create({
        x: x + 2,
        y: y,
        colorId: 15,
        ...params,
      }),
      Pixel.create({
        x: x - 2,
        y: y,
        colorId: 15,
        ...params,
      }),
      Pixel.create({
        x: x,
        y: y + 2,
        colorId: 15,
        ...params,
      }),
      Pixel.create({
        x: x,
        y: y - 2,
        colorId: 15,
        ...params,
      }),
    ].filter((e) => e.isValid());
  }

  public static createFreeze(
    x: number,
    y: number,
    userData: { id?: number; groupId?: number } = {},
  ) {
    const params = {
      colorId: Pixel.EXPLORE_COLOR,
      userId: userData.id,
      groupId: userData.groupId,
      flag: PixelFlag.FREZE,
    };
    return [
      Pixel.create({
        x: x,
        y: y,
        ...params,
      }),
      Pixel.create({
        x: x,
        y: y + 1,
        ...params,
      }),
      Pixel.create({
        x: x,
        y: y - 1,
        ...params,
      }),
      Pixel.create({
        x: x + 1,
        y: y,
        ...params,
      }),
      Pixel.create({
        x: x + 1,
        y: y + 1,
        ...params,
      }),
      Pixel.create({
        x: x + 1,
        y: y - 1,
        ...params,
      }),
      Pixel.create({
        x: x - 1,
        y: y,
        ...params,
      }),
      Pixel.create({
        x: x - 1,
        y: y + 1,
        ...params,
      }),
      Pixel.create({
        x: x - 1,
        y: y - 1,
        ...params,
      }),
      Pixel.create({
        x: x + 2,
        y: y,
        ...params,
      }),
      Pixel.create({
        x: x - 2,
        y: y,
        ...params,
      }),
      Pixel.create({
        x: x,
        y: y + 2,
        ...params,
      }),
      Pixel.create({
        x: x,
        y: y - 2,
        ...params,
      }),
    ].filter((e) => e.isValid());
  }

  public static unpack(code: number, userId: number = 0, groupId: number = 0) {
    const n = Math.floor(code / Pixel.SIZE);
    const x = (code -= n * Pixel.SIZE) % Pixel.MAX_WIDTH;
    const y = (code - x) / Pixel.MAX_WIDTH;
    const colorId = n % Pixel.MAX_COLOR_ID;
    const flag = Math.floor(n / Pixel.MAX_COLOR_ID);

    return Pixel.create({ x, y, colorId, flag, userId, groupId });
  }

  public pack() {
    const t = this.colorId + this.flag * Pixel.MAX_COLOR_ID;
    return this.x + this.y * Pixel.MAX_WIDTH + Pixel.SIZE * t;
  }

  public isValidRange() {
    return (
      this.x >= 0 &&
      this.x < Pixel.MAX_WIDTH &&
      this.y >= 0 &&
      this.y < Pixel.MAX_HEIGHT &&
      this.colorId >= Pixel.MIN_COLOR_ID &&
      this.colorId < Pixel.MAX_COLOR_ID
    );
  }

  public isValid() {
    return this.isValidRange();
  }

  public get [Symbol.toStringTag]() {
    return `Pixel(${this.x};${this.y};${this.colorId})${
      this.flag ? ` ^${PixelFlag[this.flag]}` : ''
    }${this.userId ? ` @${this.userId}` : ''}`;
  }

  public get offset() {
    return Pixel.offset(this.x, this.y);
  }

  /**
   * Хеш для уникального отслеживания.
   * Чтоыб убедиться в том, что нужный пиксель вернулся с сервера
   */
  public get hash4watch(): string {
    return hash({
      x: this.x,
      y: this.y,
      colorId: this.colorId,
      userId: this.userId,
    });
  }

  public get hashWithColor(): string {
    return hash({
      x: this.x,
      y: this.y,
      colorId: this.colorId,
    });
  }

  public get hash(): string {
    return hash({
      x: this.x,
      y: this.y,
    });
  }
}
