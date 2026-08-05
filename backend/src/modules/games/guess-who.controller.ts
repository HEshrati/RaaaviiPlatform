import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { GuessWhoService } from './guess-who.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('games/guess-who')
@UseGuards(JwtAuthGuard)
export class GuessWhoController {
  constructor(private readonly svc: GuessWhoService) {}

  // وضعیت بازی برای رویداد
  @Get('event/:eventId')
  async getState(@Param('eventId') eventId: string, @Req() req: any) {
    return this.svc.getSessionState(eventId, req.user.id);
  }

  // ایجاد/بازیابی session (ادمین یا خودکار)
  @Post('event/:eventId/session')
  async createSession(@Param('eventId') eventId: string, @Body() body: { group_profile?: string }) {
    return this.svc.getOrCreateSession(eventId, body.group_profile || 'default');
  }

  // شروع بازی
  @Post('session/:sessionId/start')
  async startSession(@Param('sessionId') sessionId: string) {
    return this.svc.startSession(sessionId);
  }

  // ثبت پاسخ
  @Post('round/:roundId/answer')
  async submitAnswer(@Param('roundId') roundId: string, @Req() req: any, @Body() body: { answer: string }) {
    return this.svc.submitAnswer(roundId, req.user.id, body.answer);
  }

  // بستن فاز پاسخ و شروع حدس
  @Post('round/:roundId/close-answers')
  async closeAnswers(@Param('roundId') roundId: string) {
    return this.svc.closeAnswersAndStartGuessing(roundId);
  }

  // ثبت حدس
  @Post('round/:roundId/guess')
  async submitGuess(@Param('roundId') roundId: string, @Req() req: any, @Body() body: { avatar: string }) {
    return this.svc.submitGuess(roundId, req.user.id, body.avatar);
  }

  // اعلام نتیجه دور
  @Post('round/:roundId/reveal')
  async revealRound(@Param('roundId') roundId: string) {
    return this.svc.revealRound(roundId);
  }

  // دور بعدی یا پایان
  @Post('session/:sessionId/next')
  async nextRound(@Param('sessionId') sessionId: string) {
    return this.svc.nextRound(sessionId);
  }
}
