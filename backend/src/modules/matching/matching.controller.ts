import { Controller, Get, Post, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { isAdminUser } from '../admin/admin.controller';
import { ForbiddenException } from '@nestjs/common';

@Controller('v1/events/:eventId')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('match-queue/join')
  @UseGuards(JwtAuthGuard)
  async joinQueue(@Param('eventId') eventId: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('احراز هویت الزامی است');
    }
    return this.matchingService.joinQueue(eventId, userId);
  }

  @Post('groups/build')
  @UseGuards(JwtAuthGuard)
  async buildGroups(@Param('eventId') eventId: string, @Req() req: any) {
    if (!isAdminUser(req.user)) {
      throw new ForbiddenException('دسترسی ادمین لازم است');
    }
    return this.matchingService.executeMatchingEngine(eventId);
  }

  @Get('match-queue/status')
  @UseGuards(JwtAuthGuard)
  async queueStatus(@Param('eventId') eventId: string) {
    return this.matchingService.getQueueStatus(eventId);
  }
}
