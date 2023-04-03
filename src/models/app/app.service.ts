import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  onModuleInit() {
    this.checkVersion().catch(console.error);
  }

  async checkVersion() {
    const curVer = process.env.npm_package_version;
    // TODO: make it (by redis)
    const lastVer = '0.0.0';

    if (lastVer !== curVer) {
      // * update `last-version` and notify
    }
  }
}
