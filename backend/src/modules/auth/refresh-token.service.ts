import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RefreshToken } from './entities/refresh-token.entity';
import { Cron } from '@nestjs/schedule';

// مدت اعتبار refresh token (پیش‌فرض ۳۰ روز - مستقل از JWT_EXPIRES_IN که برای access token است)
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || '30', 10);

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRawToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * صدور یک جفت access + refresh token جدید برای کاربر
   */
  async issueTokens(
    userPayload: Record<string, any>,
    meta?: { userAgent?: string; ip?: string },
  ): Promise<{ access_token: string; refresh_token: string }> {
    const access_token = this.jwtService.sign(userPayload);

    const rawRefreshToken = generateRawToken();
    const tokenHash = hashToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    const entity = this.repo.create({
      user_id: userPayload.userId || userPayload.id,
      token_hash: tokenHash,
      user_agent: meta?.userAgent,
      ip_address: meta?.ip,
      expires_at: expiresAt,
      is_revoked: false,
    });
    await this.repo.save(entity);

    return { access_token, refresh_token: rawRefreshToken };
  }

  /**
   * تمدید access token با استفاده از refresh token معتبر (با چرخش/rotation)
   * یعنی هر بار که استفاده شود، refresh token قبلی باطل و یک توکن جدید صادر می‌شود
   */
  async rotateToken(
    rawRefreshToken: string,
    userPayloadBuilder: (userId: string) => Promise<Record<string, any>>,
    meta?: { userAgent?: string; ip?: string },
  ): Promise<{ access_token: string; refresh_token: string }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token الزامی است');
    }

    const tokenHash = hashToken(rawRefreshToken);
    let reusedUserId: string | null = null;
    try {
      const rotated = await this.repo.manager.transaction(async (manager) => {
        const tokenRepo = manager.getRepository(RefreshToken);
        const stored = await tokenRepo.findOne({
          where: { token_hash: tokenHash },
          lock: { mode: 'pessimistic_write' },
        });
        if (!stored) throw new UnauthorizedException('Refresh token نامعتبر است');
        if (stored.is_revoked) {
          reusedUserId = stored.user_id;
          throw new UnauthorizedException('Refresh token قبلاً استفاده شده است. لطفاً دوباره وارد شوید');
        }
        if (new Date() > stored.expires_at) {
          throw new UnauthorizedException('Refresh token منقضی شده است');
        }

        const newRawToken = generateRawToken();
        const newTokenHash = hashToken(newRawToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
        const userPayload = await userPayloadBuilder(stored.user_id);

        await tokenRepo.save(tokenRepo.create({
          user_id: stored.user_id,
          token_hash: newTokenHash,
          user_agent: meta?.userAgent,
          ip_address: meta?.ip,
          expires_at: expiresAt,
          is_revoked: false,
        }));
        stored.is_revoked = true;
        stored.replaced_by_token_hash = newTokenHash;
        await tokenRepo.save(stored);
        return { newRawToken, userPayload };
      });
      return {
        access_token: this.jwtService.sign(rotated.userPayload),
        refresh_token: rotated.newRawToken,
      };
    } catch (error) {
      if (reusedUserId) await this.revokeAllForUser(reusedUserId);
      throw error;
    }
  }

  /**
   * خروج از یک دستگاه خاص (باطل کردن یک refresh token)
   */
  async revoke(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await this.repo.update({ token_hash: tokenHash }, { is_revoked: true });
  }

  /**
   * خروج از همه دستگاه‌ها (مثلاً پس از تغییر رمز یا فعالیت مشکوک)
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.update({ user_id: userId, is_revoked: false }, { is_revoked: true });
  }

  /**
   * پاکسازی توکن‌های منقضی‌شده (برای cron job)
   */
  @Cron('0 3 * * *')
  async cleanupExpired(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('expires_at < NOW()')
      .execute();
    return result.affected || 0;
  }
}
