import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get('ping')
  @Version(VERSION_NEUTRAL)
  getPing() {
    // if (this.throws > 0) {
    //   throw new BadGatewayException('many errors');
    // }
    return 'pong';
  }
}
