import * as Fs from 'fs-extra';
import * as Path from 'path';
import { TypedEmitter } from 'tiny-typed-emitter';
import * as chokidar from 'chokidar';
import { Canvas, createCanvas, loadImage } from 'canvas';

import { LoadingState } from './constants';
import { Logger, TemplateFieldOptions } from './interface';
import { getLogger } from './logger';
import { Pixel } from './pixel.class';
import { findClosestColor } from './tools';

interface TemplateFieldEvents {
  pixels: (
    /* arPixels: Pixel[], */ templatePixels: Record<number, Pixel>,
  ) => void;
}

export class TemplateField extends TypedEmitter<TemplateFieldEvents> {
  protected readonly logger: Logger;

  private cooldownTimestamp: number = 0;
  public loadingState = LoadingState.NONE;
  public lastImageUrl: string = this.options.urlToImage;

  constructor(protected readonly options: TemplateFieldOptions) {
    super();
    this.logger = getLogger(options);
  }

  public async loadTemplateField(urlToImage: string = this.lastImageUrl) {
    if (
      Date.now() - this.cooldownTimestamp <= 10 * 1e3 ||
      this.loadingState === LoadingState.LOADING
    ) {
      return false;
    }

    this.cooldownTimestamp = Date.now();
    this.loadingState = LoadingState.LOADING;

    const canvas: Canvas = createCanvas(Pixel.MAX_WIDTH, Pixel.MAX_HEIGHT);
    const ctx = canvas.getContext('2d');

    let src: string | Buffer = null;

    try {
      if (urlToImage.startsWith('http')) {
        src = `${urlToImage}?r=${new Date().getTime()}`;
      } else if (await Fs.exists(urlToImage)) {
        src = await Fs.readFile(urlToImage);
        this.logger.info('Try load saved drawn file...');
      }

      if (!src) {
        throw new Error(
          `Source image has not been empty! Try save new image to '${'./dataset/template.png'}'`,
        );
      }

      this.lastImageUrl = urlToImage;
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

      const arPixels: Pixel[] = [];
      const templatePixels: Record<number, Pixel> = {};

      for (let i = 0; i < img.length; i += 4) {
        // Skip Alpha channel
        if (img[i + 3] === 0) {
          continue;
        }

        const x = ((i / 4) % width);// + 1;
        const y = ~~(i / 4 / width);// + 1;
        const rgbAr = [img[i + 0], img[i + 1], img[i + 2]] as [
          number,
          number,
          number,
        ];
        const importance = img[i + 3];

        let colorId: number;
        if (this.options.smartColorSearch) {
          // * Поиск приблизительнго цвета
          const colorAr = findClosestColor(rgbAr, Pixel.colorMapByteArray);
          colorId = Pixel.findColorIdByColor(colorAr);
        } else {
          colorId = Pixel.findColorIdByColor(rgbAr);
        }

        const pixel = Pixel.create({
          x,
          y,
          colorId,
          importance,
        });

        if (pixel.isValid()) {
          arPixels.push(pixel);
          templatePixels[pixel.offset] = pixel /* .colorId */;
        }
      }

      this.logger.info(`Loaded ${arPixels.length} pixels`);
      this.emit('pixels', /* arPixels, */ templatePixels);
    } catch (err) {
      this.logger.error('Load drawn image failed', err);
      this.loadingState = LoadingState.ERROR;
      return false;
    }

    this.loadingState = LoadingState.LOADED;
    return true;
  }

  public watchFolder(folder: string) {
    try {
      this.logger.info(`Watching for folder changes on: ${folder}`);

      const watcher = chokidar.watch(folder, { persistent: true });
      watcher.on('change', async (filePath) => {
        if (
          this.lastImageUrl &&
          !this.lastImageUrl.startsWith('http') &&
          Path.basename(filePath) === this.fileName
        ) {
          this.logger.info(`${filePath} has been changed.`);
          this.loadTemplateField();
        }
      });
    } catch (err) {
      this.logger.error(err);
    }
  }

  public get fileName(): string {
    return Path.basename(this.lastImageUrl);
  }
}
