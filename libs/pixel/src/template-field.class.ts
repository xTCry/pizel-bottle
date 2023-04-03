import * as Fs from 'fs-extra';
import * as Path from 'path';
import * as chokidar from 'chokidar';
import { Canvas, createCanvas, loadImage } from 'canvas';

import { LoadingState } from './constants';
import { Logger, TemplateFieldOptions } from './interface';
import { getLogger } from './logger';
import { Pixel } from './pixel.class';

export class TemplateField {
  public loadingState = LoadingState.NONE;
  public path2file = './dataset/template.png';

  private cooldownTimestamp: number = 0;

  protected readonly logger: Logger;

  constructor(options: TemplateFieldOptions) {
    this.logger = getLogger(options);
  }

  public async loadTemplateField(url2Image?: string) {
    // url2Image ??= config.get('IMG_URL');

    if (
      Date.now() - this.cooldownTimestamp <= 10 * 1e3 ||
      this.loadingState === LoadingState.LOADING
    ) {
      return false;
    }

    this.cooldownTimestamp = Date.now();
    this.loadingState = LoadingState.LOADING;

    // Загружаемое изображение
    const canvas: Canvas = createCanvas(Pixel.MAX_WIDTH, Pixel.MAX_HEIGHT);
    const ctx = canvas.getContext('2d');

    let src: string | Buffer = null;

    try {
      if (url2Image) {
        src = `${url2Image}?r=${new Date().getTime()}`;
      } else if (await Fs.exists(this.path2file)) {
        src = await Fs.readFile(this.path2file);
        this.logger.info('Try load saved drawn file...');
      }

      if (!src) {
        throw new Error(
          `Source image has not been empty! Try save new image to ${this.path2file}`,
        );
      }

      const resultImg = await loadImage(src, {
        timeout: 180e3,
      });
      this.logger.info('Image loaded');

      const { width, height } = resultImg;
      canvas.width = width;
      canvas.height = height;

      const argsc = [0, 0, canvas.width, canvas.height] as const;
      ctx.drawImage(resultImg, ...argsc);

      const { data: img } = ctx.getImageData(...argsc);

      this.logger.info(`Template field size: ${img.length} pixels`);

      let arPixels = [];
      for (let i = 0; i < img.length; i += 4) {
        // Skip Alpha channel
        if (img[i + 3] === 0) {
          continue;
        }
      }

      this.logger.info(`Loaded ${arPixels.length} pixels`);
      // BattleField.arPixels = arPixels;

      this.loadingState = LoadingState.LOADED;
      return true;
    } catch (error) {
      this.logger.error('Load drawn image failed', error);
      this.loadingState = LoadingState.ERROR;
    }
    return false;
  }

  public watchFolder(folder: string) {
    try {
      this.logger.info(`Watching for folder changes on: ${folder}`);

      const watcher = chokidar.watch(folder, { persistent: true });
      watcher.on('change', async (filePath) => {
        if (Path.basename(filePath) === this.fileName) {
          this.logger.info(`${filePath} has been changed.`);
          this.loadTemplateField();
        }
      });
    } catch (err) {
      this.logger.error(err);
    }
  }

  public get fileName(): string {
    return Path.basename(this.path2file);
  }
}
