import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Sentry } from '../../sentry.setup';

/**
 * این فیلتر تمام خطاهای catch-نشده را می‌گیرد.
 * فقط خطاهای ۵۰۰ (سرور) به Sentry فرستاده می‌شوند - خطاهای ۴xx (مثل
 * BadRequestException برای OTP اشتباه) نویز محسوب می‌شوند و فرستاده نمی‌شوند.
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('SentryExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'خطای داخلی سرور';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any)?.message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // فقط خطاهای واقعی سرور (۵۰۰+) به Sentry می‌رود
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status}: ${message}`);
      if (process.env.SENTRY_DSN) {
        Sentry.withScope((scope) => {
          scope.setTag('path', request.url);
          scope.setTag('method', request.method);
          scope.setContext('request', {
            url: request.url,
            method: request.method,
            userId: request.user?.id,
          });
          Sentry.captureException(exception);
        });
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
