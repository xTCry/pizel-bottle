import { Test, TestingModule } from '@nestjs/testing';
import { PixelService } from './pixel.service';

describe('PixelService', () => {
  let service: PixelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PixelService],
    }).compile();

    service = module.get<PixelService>(PixelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
