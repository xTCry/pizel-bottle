import {
  HttpStatus,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      this.logger.error(exception.message, exception.stack);
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const code = exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;
    const expResponse = exception.getResponse() as string | any;
    const { message } = exception;

    let error: string;
    let payload: any;
    if (typeof expResponse !== 'string') {
      payload = expResponse.payload;
      error ??= expResponse.error;
    }
    error ??= exception.name;

    response.status(code).json({
      error: {
        code,
        message,
        error,
        timestamp: new Date().toISOString(),
        payload,
      },
    });
  }
}
