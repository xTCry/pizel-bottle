import { Module } from '@nestjs/common';
import { PixelService } from './pixel.service';

@Module({
  providers: [PixelService],
  exports: [PixelService],
})
export class PixelModule {}
