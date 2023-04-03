import { PixelApiOptions } from './interface';

export class PixelApi {
  public embedUrl: string;

  constructor(protected options: PixelApiOptions) {
    this.embedUrl = options.embedUrl;
  }
}
