import { Controller, Get, Post, Body, Query, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { RgciService, RGCI_QUESTIONS } from './rgci.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { isAdminUser } from '../admin/admin.controller';

@Controller('rgci')
@UseGuards(JwtAuthGuard)
export class RgciController {
  constructor(private readonly rgciService: RgciService) {}

  // دریافت سوالات RGCI
  @Get('questions')
  getQuestions() {
    return { questions: RGCI_QUESTIONS };
  }

  // ثبت پاسخ‌های RGCI
  @Post('submit')
  async submitRgci(@Req() req: any, @Body() body: {
    event_id?: string;
    responses: Record<string, number[]>;
  }) {
    return this.rgciService.submitRgci(req.user.id, body.event_id || null, body.responses);
  }

  // دریافت نمره RGCI کاربر
  @Get('my-score')
  async getMyScore(@Req() req: any, @Query('event_id') eventId?: string) {
    return this.rgciService.getMyRgci(req.user.id, eventId);
  }

  // ثبت پرسشنامه پس از رویداد
  @Post('post-event')
  async submitPostEvent(@Req() req: any, @Body() body: {
    event_id: string;
    group_id?: string;
    responses: Record<string, number>;
  }) {
    return this.rgciService.submitPostEventSurvey(
      req.user.id, body.event_id, body.group_id || null, body.responses
    );
  }

  // ثبت پیامدهای روانشناختی
  @Post('outcome')
  async submitOutcome(@Req() req: any, @Body() body: {
    event_id?: string;
    stage: 'pre' | 'post' | 'followup';
    responses: Record<string, number>;
  }) {
    return this.rgciService.submitOutcome(req.user.id, body.event_id || null, body.stage, body.responses);
  }

  // پیشنهاد مقاله بر اساس نیاز روانشناختی
  @Get('article-recommendations')
  async getArticleRecommendations(@Req() req: any) {
    return this.rgciService.getArticleRecommendations(req.user.id);
  }

  // آمار کامل کاربر
  @Get('my-stats')
  async getMyStats(@Req() req: any) {
    return this.rgciService.getMyStats(req.user.id);
  }

  // پروفایل کامل RGCI با فرمت استاندارد PDF (فاز ۲)
  @Get('users/:userId/profile')
  async getRgciProfile(@Param('userId') userId: string, @Req() req: any) {
    if (req.user.id !== userId && !isAdminUser(req.user)) {
      throw new ForbiddenException('دسترسی به پروفایل رفتاری این کاربر مجاز نیست');
    }
    return this.rgciService.getFullRgciProfile(userId);
  }
}
