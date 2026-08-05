import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const testPhone = '09123456789'; // شماره تست - باید با ENABLE_DEV_OTP=true کار کند
  let devCode: string;
  let accessToken: string;
  let refreshToken: string;

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

  describe('POST /api/auth/request-otp', () => {
    it('باید با شماره معتبر، کد OTP بفرستد (در DEV mode)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/request-otp')
        .send({ phone: testPhone })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      // در DEV mode باید dev_code برگردد
      if (res.body.dev_code) {
        devCode = res.body.dev_code;
      }
    });

    it('باید با شماره نامعتبر خطا بدهد', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/request-otp')
        .send({ phone: '12345' })
        .expect(400);
    });

    it('باید بدون شماره خطا بدهد', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/request-otp')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('باید با کد اشتباه خطا بدهد', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, code: '000000' })
        .expect(400);
    });

    it('باید با کد صحیح، access_token و refresh_token برگرداند', async () => {
      if (!devCode) {
        console.warn('⚠️ DEV_CODE موجود نیست - این تست را skip می‌کنیم (ENABLE_DEV_OTP باید true باشد)');
        return;
      }

      const res = await request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ phone: testPhone, code: devCode, name: 'کاربر تست' })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.mobileNumber).toBe(testPhone);

      accessToken = res.body.access_token;
      refreshToken = res.body.refresh_token;
    });
  });

  describe('GET /api/auth/profile', () => {
    it('باید بدون توکن، 401 برگرداند', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('باید با توکن معتبر، پروفایل برگرداند', async () => {
      if (!accessToken) {
        console.warn('⚠️ accessToken موجود نیست - skip');
        return;
      }
      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('mobileNumber', testPhone);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('باید بدون refresh_token خطا بدهد', async () => {
      await request(app.getHttpServer()).post('/api/auth/refresh').send({}).expect(400);
    });

    it('باید با refresh_token نامعتبر، 401 برگرداند', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-token-xyz' })
        .expect(401);
    });

    it('باید با refresh_token معتبر، access_token جدید برگرداند', async () => {
      if (!refreshToken) {
        console.warn('⚠️ refreshToken موجود نیست - skip');
        return;
      }
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      // توکن جدید باید متفاوت از قبلی باشد (rotation)
      expect(res.body.refresh_token).not.toBe(refreshToken);
    });

    it('باید استفاده دوباره از refresh_token قبلی (بعد از rotation) را رد کند', async () => {
      if (!refreshToken) {
        console.warn('⚠️ refreshToken موجود نیست - skip');
        return;
      }
      // refreshToken قبلی الان باید باطل شده باشد چون در تست بالا rotate شد
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('باید بدون توکن، 401 برگرداند', async () => {
      await request(app.getHttpServer()).post('/api/auth/logout-all').expect(401);
    });
  });
});
