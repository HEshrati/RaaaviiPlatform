import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class BotSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const secret = req.headers['x-ravi-bot-secret'];
    const expected = process.env.RAVI_BOT_SECRET;
    if (!expected || !secret || secret !== expected) {
      throw new UnauthorizedException('Invalid bot secret');
    }
    return true;
  }
}
