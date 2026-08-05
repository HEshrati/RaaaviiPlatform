import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * محافظت endpointهای داخلی بله (notify، send-otp و ...)
 * از secret مشترک با RAVI_BOT_SECRET یا BALE_INTERNAL_SECRET استفاده می‌کند.
 */
@Injectable()
export class BaleInternalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const secret =
      req.headers['x-ravi-bot-secret'] ||
      req.headers['x-bale-internal-secret'];
    const expected =
      process.env.BALE_INTERNAL_SECRET ||
      process.env.RAVI_BOT_SECRET ||
      process.env.BALE_BOT_WEBHOOK_SECRET;
    if (!expected || !secret || secret !== expected) {
      throw new UnauthorizedException('Invalid internal secret');
    }
    return true;
  }
}
