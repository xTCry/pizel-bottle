import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';

import * as xEnv from '@my-environment';
import { HttpExceptionFilter } from '@my-common';

import { AppModule } from './models/app/app.module';

async function bootstrap() {
  Logger.log(
    `🥙 Application (${process.env.npm_package_name}@v${process.env.npm_package_version})`,
    'NestJS',
  );

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      disableErrorMessages: false,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableShutdownHooks();
  app.enableCors({});

  if (xEnv.USE_LOCALHOST) {
    await app.listen(xEnv.SERVER_PORT, '127.0.0.1');
  } else {
    await app.listen(xEnv.SERVER_PORT);
  }

  if (!xEnv.USE_LOCALHOST) {
    if (xEnv.NODE_ENV !== xEnv.EnvType.PROD) {
      Logger.log(
        `🤬  Application is running on: ${await app.getUrl()}`,
        'Bootstrap',
      );
    } else {
      Logger.log(
        `🚀  Server ready at http://${xEnv.DOMAIN}:${xEnv.SERVER_PORT}/api`,
        'Bootstrap',
      );
    }
  } else {
    Logger.log(
      `🚀  Server is listening on port ${xEnv.SERVER_PORT}`,
      'Bootstrap',
    );
  }
}

bootstrap()
  .then()
  .catch((e) => {
    Logger.warn(`❌  Error starting server, ${e}`, 'Bootstrap');
    throw e;
  });
