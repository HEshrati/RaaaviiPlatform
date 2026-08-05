import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { Who5Service } from './who5.service';
import { PostFeedbackService } from './post-feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class Who5Controller {
  constructor(
    private readonly who5: Who5Service,
    private readonly postFeedback: PostFeedbackService,
  ) {}

  // سوالات WHO-5
  @Get('who5/questions')
  getQuestions() {
    return { questions: Who5Service.QUESTIONS, labels: Who5Service.LABELS };
  }

  // ثبت WHO-5 (پیش یا پس از رویداد)
  @Post('who5')
  async submitWho5(@Req() req: any, @Body() body: { event_id?: string; phase: 'pre' | 'post'; scores: number[] }) {
    return this.who5.submit(req.user.id, body.event_id || null, body.phase, body.scores);
  }

  // وضعیت WHO-5 کاربر برای رویداد
  @Get('who5/event/:eventId')
  async getMyWho5(@Req() req: any, @Param('eventId') eventId: string, @Query('phase') phase: 'pre' | 'post') {
    return this.who5.getMyResponse(req.user.id, eventId, phase);
  }

  // آمار WHO-5 رویداد (ادمین)
  @Get('who5/event/:eventId/analysis')
  async getAnalysis(@Param('eventId') eventId: string) {
    return this.who5.getEventAnalysis(eventId);
  }

  // سوالات فیدبک اجباری
  @Get('post-event/questions')
  getFeedbackQuestions() {
    return { questions: PostFeedbackService.QUESTIONS };
  }

  // ثبت فیدبک پس از رویداد
  @Post('post-event')
  async submitFeedback(@Req() req: any, @Body() body: {
    event_id: string;
    ratings: Record<string, number>;
    comment?: string;
  }) {
    return this.postFeedback.submit(req.user.id, body.event_id, body.ratings, body.comment);
  }

  // آیا فیدبک ثبت شده؟
  @Get('post-event/event/:eventId/submitted')
  async hasSubmitted(@Req() req: any, @Param('eventId') eventId: string) {
    return { submitted: await this.postFeedback.hasSubmitted(req.user.id, eventId) };
  }

  // آمار فیدبک رویداد (ادمین)
  @Get('post-event/event/:eventId/stats')
  async getStats(@Param('eventId') eventId: string) {
    return this.postFeedback.getEventStats(eventId);
  }
}
