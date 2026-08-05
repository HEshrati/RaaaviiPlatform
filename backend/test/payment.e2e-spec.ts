import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Payment (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/payment/verify', () => {
    it('باید بدون authority، خطا یا ریدایرکت به صفحه خطا بدهد', async () => {
      const res = await request(app.getHttpServer()).get('/api/payment/verify');
      // بسته به پیاده‌سازی verifyPayment، ممکن است 400 یا یک ریدایرکت (302) برگرداند
      expect([302, 400, 404]).toContain(res.status);
    });

    it('باید با authority نامعتبر، عملیات verify را با خطا/ریدایرکت به failure مدیریت کند', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/payment/verify')
        .query({ Authority: 'INVALID_TEST_AUTHORITY_000', Status: 'OK' });
      // نباید 500 بدهد - یعنی باید gracefully هندل شده باشد
      expect(res.status).not.toBe(500);
    });

    it('باید با Status=NOK (کاربر پرداخت را لغو کرده)، gracefully هندل شود', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/payment/verify')
        .query({ Authority: 'TEST_AUTHORITY', Status: 'NOK' });
      expect(res.status).not.toBe(500);
    });
  });

  describe('GET /api/payments/verify', () => {
    it('باید بدون پارامتر، 500 ندهد', async () => {
      const res = await request(app.getHttpServer()).get('/api/payments/verify');
      expect(res.status).not.toBe(500);
    });
  });

  describe('POST /api/payment/request', () => {
    it('باید بدون احراز هویت، 401 بدهد (اگر این مسیر محافظت‌شده است)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payment/request')
        .send({ amount: 10000 });
      // اگر این مسیر عمومی است، انتظار 400 (داده ناقص) داریم نه 401
      expect([400, 401]).toContain(res.status);
    });
  });

  describe('GET /api/admin/financial/summary', () => {
    it('باید بدون توکن، 401 بدهد', async () => {
      await request(app.getHttpServer()).get('/api/admin/financial/summary').expect(401);
    });
  });
});
