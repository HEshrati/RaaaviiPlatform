import * as Sentry from '@sentry/node';

/**
 * راه‌اندازی Sentry - باید قبل از NestFactory.create() در main.ts صدا زده شود.
 * اگر SENTRY_DSN تعریف نشده باشد، این تابع بی‌اثر است (Sentry غیرفعال می‌ماند)
 * تا در محیط dev یا سرورهایی که هنوز DSN ندارند خطا ندهد.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn('⚠️ SENTRY_DSN تعریف نشده - مانیتورینگ خطا غیرفعال است');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    // اطلاعات حساس کاربر (شماره موبایل، توکن) را قبل از ارسال حذف کن
    beforeSend(event) {
      if (event.request?.data) {
        const data = event.request.data as any;
        if (typeof data === 'object') {
          delete data.code; // کد OTP
          delete data.refresh_token;
          delete data.access_token;
          delete data.password;
        }
      }
      return event;
    },
  });

  console.log('✅ Sentry فعال شد (environment: ' + (process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV) + ')');
}

export { Sentry };
