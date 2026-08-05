import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable, UnauthorizedException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../database/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { RefreshTokenService } from './refresh-token.service';
import { randomInt } from 'crypto';
import { SmsService } from '../sms/sms.service';

const IS_DEV = process.env.NODE_ENV !== 'production';
const ENABLE_DEV_OTP = process.env.ENABLE_DEV_OTP === 'true';

// OTP store with rate limiting: tracks OTP code + request count
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number; lastRequest: number; role?: string }>();
const OTP_MAX_ATTEMPTS = 5; // max wrong guesses
const OTP_RATE_LIMIT_MS = 60_000; // 1 minute between requests

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectDataSource() private dataSource: DataSource,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly smsService: SmsService,
  ) {}

  async sendOtp(phone: string): Promise<{ message: string; dev_code?: string; via?: string }> {
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('شماره موبایل الزامی است');
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^09\d{9}$/.test(cleanPhone)) {
      throw new BadRequestException('Invalid phone number. Example: 09123456789');
    }

    // Rate limit: prevent spam requests
    const existing = otpStore.get(cleanPhone);
    if (existing && Date.now() - existing.lastRequest < OTP_RATE_LIMIT_MS) {
      const wait = Math.ceil((OTP_RATE_LIMIT_MS - (Date.now() - existing.lastRequest)) / 1000);
      throw new BadRequestException(`لطفاً ${wait} ثانیه صبر کنید`);
    }

      const otpCode = randomInt(100000, 1_000_000).toString();
      otpStore.set(cleanPhone, {
        code: otpCode,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
        lastRequest: Date.now(),
        role: 'user',
      });

      // ذخیره در DB برای دسترسی بله
      try {
        await this.dataSource.query(`DELETE FROM otps WHERE mobile_number = $1`, [cleanPhone]);
        await this.dataSource.query(
          `INSERT INTO otps (code, mobile_number, expires_at, is_used) VALUES ($1, $2, NOW() + INTERVAL '5 minutes', false)`,
          [otpCode, cleanPhone]
        );
      } catch {}

      // DEV MODE — dev_code فقط وقتی ENABLE_DEV_OTP فعال باشد
      if (IS_DEV && ENABLE_DEV_OTP) {
        return { message: 'OTP sent (DEV mode)', dev_code: otpCode };
      }

      // PRODUCTION: بله اول، بعد SMS
      let baleSent = false;
      let smsSent = false;
      try {
        const normPhone = cleanPhone.replace(/^0/, '98');
        const baleRows = await this.dataSource.query(
          'SELECT chat_id FROM bale_user_chats WHERE phone=$1 LIMIT 1', [normPhone]
        );
        if (baleRows?.[0]?.chat_id) {
          const baleToken = process.env.BALE_BOT_TOKEN || '';
          const baleApi = process.env.BALE_BOT_API_URL || 'https://tapi.bale.ai';
          const msg = '🔐 *کد ورود راوی*\n\nکد: `' + otpCode + '`\n\n⏱ ۵ دقیقه اعتبار دارد';
          const r = await fetch(`${baleApi}/bot${baleToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: String(baleRows[0].chat_id), text: msg, parse_mode: 'Markdown' }),
          });
          const rd: any = await r.json(); baleSent = rd?.ok === true;
        }
      } catch {}

      const smsResult = await this.smsService.sendOtp(cleanPhone, otpCode);
      smsSent = smsResult.success;

      if (!smsSent && !baleSent) {
        otpStore.delete(cleanPhone);
        await this.dataSource.query(`DELETE FROM otps WHERE mobile_number = $1`, [cleanPhone]).catch(() => undefined);
        throw new ServiceUnavailableException('ارسال کد ورود ناموفق بود؛ لطفاً کمی بعد دوباره تلاش کنید');
      }

      return {
        message: smsSent ? (baleSent ? 'کد از طریق پیامک و بله ارسال شد' : 'کد از طریق پیامک ارسال شد') : (baleSent ? 'کد از طریق بله ارسال شد' : 'کد ارسال شد'), via: smsSent ? (baleSent ? 'sms+bale' : 'sms') : (baleSent ? 'bale' : 'unknown'),
      };
  }

  async verifyOtp(
    phone: string,
    code: string,
    name?: string,
    meta?: { userAgent?: string; ip?: string },
    requestedRole?: string,
    medicalCode?: string,
  ): Promise<{ access_token: string; refresh_token: string; user: any }> {
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('شماره موبایل الزامی است');
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const stored = otpStore.get(cleanPhone);

    if (!stored) throw new BadRequestException('OTP expired or not sent');
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanPhone);
      throw new BadRequestException('OTP expired');
    }

    // Brute-force protection
    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts > OTP_MAX_ATTEMPTS) {
      otpStore.delete(cleanPhone);
      throw new BadRequestException('تعداد تلاش‌ها از حد مجاز گذشت. لطفاً کد جدید دریافت کنید');
    }

    if (stored.code !== code) throw new BadRequestException('کد وارد شده اشتباه است');

    otpStore.delete(cleanPhone);

    let user = await this.userRepository.findOne({ where: { mobileNumber: cleanPhone } });
    if (!user) {
      // «همکار» یک جریان ثبت‌نام و تکمیل پروفایل فضای میزبان دارد؛ بنابراین
      // فقط در زمان ساخت حساب، نقش partner را می‌پذیریم تا کاربر مستقیم وارد
      // پنل همکاران شود. سایر نقش‌های حرفه‌ای همچنان نیازمند تأیید جداگانه‌اند
      // و کاربران موجود نیز با ارسال role در ورود، ارتقا پیدا نمی‌کنند.
      const initialRole = requestedRole === 'partner' ? 'partner' : requestedRole === 'psychologist' ? 'psychologist' : requestedRole === 'facilitator' ? 'facilitator' : 'user';

      user = this.userRepository.create({
        mobileNumber: cleanPhone,
        isVerified: true,
        role: initialRole,
        name: name ? name.trim() : '',
        loginCount: 1,
      });
      await this.userRepository.save(user);

      if (initialRole === 'psychologist') {
        const [firstName, ...restName] = (name || '').trim().split(' ');
        await this.dataSource.query(
          `INSERT INTO psychologist_profiles (user_id, license_number, mobile_number, first_name, last_name, verification_status, professional_status)
           VALUES ($1, $2, $3, $4, $5, 'pending_admin', 'mobile_verified')
           ON CONFLICT (user_id) DO NOTHING`,
          [user.id, medicalCode || null, cleanPhone, firstName || '', restName.join(' ') || ''],
        ).catch(() => undefined);
      }
    } else {
      user.isVerified = true;
      if (name && !user.name) user.name = name;
      user.loginCount = (user.loginCount || 0) + 1;
      await this.userRepository.save(user);
    }

    const tokenPayload = {
      userId: user.id,
      mobileNumber: user.mobileNumber,
      role: user.role,
      isTestTaken: user.isTestTaken || false,
    };

    const { access_token, refresh_token } = await this.refreshTokenService.issueTokens(tokenPayload, meta);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name || '',
        mobileNumber: user.mobileNumber,
        avatar: user.avatar,
        role: user.role,
        isTestTaken: user.isTestTaken || false,
        loginCount: user.loginCount || 0,
        // Profile is complete when user has name (city is checked client-side via AppContext)
        isProfileComplete: !!(user.name && user.name.trim()),
      },
    };
  }

  /**
   * تمدید access token با استفاده از refresh token (با rotation)
   */
  async refreshAccessToken(
    refreshToken: string,
    meta?: { userAgent?: string; ip?: string },
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.refreshTokenService.rotateToken(
      refreshToken,
      async (userId: string) => {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('کاربر یافت نشد');
        return {
          userId: user.id,
          mobileNumber: user.mobileNumber,
          role: user.role,
          isTestTaken: user.isTestTaken || false,
        };
      },
      meta,
    );
  }

  /** خروج از یک دستگاه (باطل کردن یک refresh token) */
  async logoutDevice(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await this.refreshTokenService.revoke(refreshToken);
    }
  }

  /** خروج از همه دستگاه‌ها */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllForUser(userId);
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...safe } = user as User & Record<string, unknown>;
    return safe;
  }

  async register(dto: { email?: string; mobileNumber?: string; password?: string }) {
    const { email, mobileNumber, password } = dto;
    const where: any[] = [];
    if (email) where.push({ email });
    if (mobileNumber) where.push({ mobileNumber });

    const existing = where.length > 0 ? await this.userRepository.findOne({ where }) : null;
    if (existing) throw new BadRequestException('User already registered');

    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
    const user = this.userRepository.create({ email, mobileNumber, passwordHash, isVerified: false, role: 'user' });
    await this.userRepository.save(user);

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const { access_token, refresh_token } = await this.refreshTokenService.issueTokens(tokenPayload);

    return { access_token, refresh_token, user: this.sanitizeUser(user) };
  }

  async login(dto: { identifier: string; password: string }) {
    const { identifier, password } = dto;
    const isEmail = identifier.includes('@');
    const user = await this.userRepository.findOne({
      where: isEmail ? { email: identifier } : { mobileNumber: identifier },
    });

    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const { access_token, refresh_token } = await this.refreshTokenService.issueTokens(tokenPayload);

    return { access_token, refresh_token, user: this.sanitizeUser(user) };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      name: user.name || '',
      mobileNumber: user.mobileNumber,
      avatar: user.avatar,
      role: user.role,
      isTestTaken: user.isTestTaken || false,
      isProfileComplete: !!user.name,
      loginCount: user.loginCount || 0,
    };
  }

  async markTestTaken(userId: string) {
    await this.userRepository.update(userId, { isTestTaken: true });
    return { success: true };
  }

  async validateUser(userId: string) {
    return this.userRepository.findOne({ where: { id: userId } });
  }
  async checkPhoneExists(phone: string): Promise<boolean> {
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('شماره موبایل الزامی است');
    }
    const clean = phone.replace(/\D/g, '');
    const user = await this.userRepository.findOne({ where: { mobileNumber: clean } });
    return !!user;
  }


  // بررسی تکراری بودن نام+فامیل
  async checkNameExists(name: string): Promise<boolean> {
    // نام اشخاص شناسه یکتا نیست و چند کاربر می‌توانند نام یکسان داشته باشند.
    return false;
  }



}
