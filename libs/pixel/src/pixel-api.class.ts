import * as Url from 'url';
import axios from 'axios';
import { Logger, PixelApiOptions } from './interface';
import { decodeURLParams } from './tools';
import { getLogger } from './logger';

export class PixelApi {
  public static logger: Logger = getLogger({ logger: console });
  public static apiUrl: string;

  public static setOptions(options: PixelApiOptions) {
    PixelApi.logger = getLogger(options);
    PixelApi.apiUrl = options.apiUrl;
  }

  public static createApi(embedUrl: string) {
    const { protocol, host, search } = Url.parse(embedUrl);
    const referer = `${protocol}://${host}/`;
    const apiUrl = PixelApi.apiUrl;

    const instance = axios.create({
      baseURL: `${apiUrl}/api/`,
      timeout: 180e3,
      headers: {
        referer,
        origin: referer,
        ...(search && { 'X-vk-sign': search }),
      },
    });
    return instance;
  }

  public static getUserId(embedUrl: string) {
    const search = this.getSearch(embedUrl);
    const { vk_user_id } = decodeURLParams(search);
    if (!vk_user_id) {
      return undefined;
    }
    return parseInt(vk_user_id);
  }

  public static getSearch(embedUrl: string) {
    return Url.parse(embedUrl).search;
  }

  public static getHost(embedUrl: string) {
    return Url.parse(embedUrl).host;
  }

  public static prepareWsUrl(
    embedUrl: string,
    url: string,
    {
      teamId = '',
    }: {
      teamId?: string;
    } = {},
  ) {
    const search = this.getSearch(embedUrl);
    url += search;

    if (teamId) {
      url += `&teamId=${teamId}`;
    }

    // if (Math.random() > 0.15) {
    //   url = url.replace('pixel-dev.w84.vkforms.ru', 'pixel.w83.vkforms.ru');
    // }

    return url;
  }
}
