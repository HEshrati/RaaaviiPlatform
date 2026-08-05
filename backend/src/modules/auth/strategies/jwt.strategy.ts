import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // payload.userId (نه payload.sub)
    const userId = payload.userId || payload.sub;
    if (!userId) throw new UnauthorizedException('توکن نامعتبر است');

    // `findOne` برای کاربر حذف‌شده خطای 404 می‌دهد. آن خطا نباید به 500
    // تبدیل شود؛ از دید احراز هویت، توکن متعلق به چنین کاربری نامعتبر است.
    let user;
    try {
      user = await this.usersService.findOne(userId);
    } catch {
      throw new UnauthorizedException('نشست کاربری معتبر نیست');
    }

    if (!user) throw new UnauthorizedException('کاربر یافت نشد');
    if (user.is_banned) throw new UnauthorizedException('حساب کاربری مسدود شده است');

    return { id: user.id, userId: user.id, email: user.email, role: user.role, mobileNumber: user.mobileNumber };
  }
}
