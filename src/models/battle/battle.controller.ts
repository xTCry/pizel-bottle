import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  Res,
  Version,
} from '@nestjs/common';
import { Response } from 'express';
import { Canvas, createCanvas } from 'canvas';
import { InjectBattleField, InjectTemplateField } from '@my-common/decorators';
import {
  AddWarriorDto,
  AddWarriorsDto,
  SetTemplateFieldDto,
} from '@my-common/dto';
import { BattleField, TemplateField } from '@bottle/pixel';
import { BattleState } from '@bottle/pixel/constants';
import { Pixel } from '@bottle/pixel/pixel.class';

import { BattleService } from './battle.service';

@Controller('battle')
export class BattleController {
  constructor(
    private readonly battleServiec: BattleService,
    @InjectBattleField()
    private readonly battleField: BattleField,
    @InjectTemplateField()
    private readonly templateField: TemplateField,
  ) {}

  @Get('stats')
  @Version('1')
  getStats() {
    return { stats: this.battleField.stats };
  }

  @Get('state')
  @Version('1')
  getState() {
    return { state: this.battleField.battleState };
  }

  @Post('state/:state')
  @Version('1')
  setState(@Param('state', ParseIntPipe) state: BattleState) {
    this.battleServiec.setBattleState(state);
    return { state: this.battleField.battleState };
  }

  @Post('warrior')
  @Version('1')
  async addWarrior(
    @Body() addWarrirDto: AddWarriorDto,
    @Query('sync', new DefaultValuePipe(true), ParseBoolPipe) sync: boolean,
    @Query('save', new DefaultValuePipe(false), ParseBoolPipe) save: boolean,
  ) {
    const warriorAsync = this.battleField.addWarrior({
      embedUrl: addWarrirDto.embedUrl,
    });

    if (sync) {
      warriorAsync
        .then(async (warrior) => {
          if (save && warrior) {
            await this.battleServiec.saveEmbeds([addWarrirDto.embedUrl]);
          }
        })
        .catch();
      return { queue: true };
    }

    const warrior = await warriorAsync;
    if (!warrior) {
      return {
        error: {
          message: 'Wrong embed Url or Warrior has already been added',
        },
      };
    }
    if (save) {
      await this.battleServiec.saveEmbeds([addWarrirDto.embedUrl]);
    }

    return { success: 1, userId: warrior.userId };
  }

  @Post('warriors')
  @Version('1')
  async addWarriors(
    @Body() addWarrirsDto: AddWarriorsDto,
    @Query('sync', new DefaultValuePipe(true), ParseBoolPipe) sync: boolean,
    @Query('save', new DefaultValuePipe(false), ParseBoolPipe) save: boolean,
  ) {
    const warriorsAsync = Promise.all(
      addWarrirsDto.embedUrls.map((embedUrl) =>
        this.battleField.addWarrior({ embedUrl }),
      ),
    );

    if (sync) {
      warriorsAsync
        .then(async (warriors) => {
          if (save) {
            await this.battleServiec.saveEmbeds(
              warriors.filter(Boolean).map((e) => e.embedUrl),
            );
          }
        })
        .catch();
      return { queue: true };
    }

    const warriors = await warriorsAsync;
    const response = {
      success: 0,
      fail: 0,
      userIds: [],
    };

    for (const warrior of warriors) {
      if (!warrior) {
        response.fail++;
      } else {
        response.success++;
        response.userIds.push(warrior.userId);
      }
    }

    if (save) {
      await this.battleServiec.saveEmbeds(
        warriors.filter(Boolean).map((e) => e.embedUrl),
      );
    }

    return response;
  }

  @Post('template')
  @Version('1')
  async setTemplateField(@Body() setTemplateFieldDto: SetTemplateFieldDto) {
    const result = await this.templateField.loadTemplateField(
      setTemplateFieldDto.urlToImage,
    );

    return { result };
  }

  @Get('field')
  @Version('1')
  getField(
    @Res() response: Response,
    @Query('template', new DefaultValuePipe(false), ParseBoolPipe)
    template: boolean,
    @Query('overlay', new DefaultValuePipe(false), ParseBoolPipe)
    overlay: boolean,
  ) {
    const canvas: Canvas = createCanvas(Pixel.MAX_WIDTH, Pixel.MAX_HEIGHT);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const img = imgData.data;

    console.time('[API] pixelField');
    for (let i = 0; i < img.length; i += 4) {
      const index = i / 4;

      let alpha = 255;
      let colorId = -1;

      if (template || overlay) {
        // const { x, y } = Pixel.unOffset(index);
        // const pixel = this.battleField.arPixels.find(
        //   (e) => e.x == x && e.y == y,
        // );
        const pixel = this.battleField.templatePixels[index];
        if (pixel) {
          alpha = pixel.importance;
          colorId = pixel.colorId;
        } else if (overlay) {
          colorId = this.battleField.mainCanvas[index];
        } else {
          continue;
        }
      } else {
        colorId = this.battleField.mainCanvas[index];
      }

      if (
        colorId === undefined ||
        colorId === -1 ||
        !(colorId in Pixel.colorMapByteArray)
      ) {
        continue;
      }
      const color = Pixel.colorMapByteArray[colorId];

      img[i + 0] = color[0];
      img[i + 1] = color[1];
      img[i + 2] = color[2];
      img[i + 3] = alpha;
    }
    console.timeEnd('[API] pixelField');

    ctx.putImageData(imgData, 0, 0);

    response.writeHead(200, {
      'Content-Type': 'image/png',
    });
    canvas.createPNGStream({}).pipe(response);
  }
}
