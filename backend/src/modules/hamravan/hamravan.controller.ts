import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HamravanService } from './hamravan.service';

@Controller('hamravan')
@UseGuards(JwtAuthGuard)
export class HamravanController {
  constructor(private readonly svc: HamravanService) {}

  @Get('protocol')
  protocol() { return this.svc.getProtocol(); }

  @Get('needs-assessment')
  getNeedsAssessment() {
    return this.svc.getNeedsAssessmentQuestions();
  }

  @Post('needs-assessment')
  submitNeedsAssessment(@Req() req: any, @Body() body: { answers: Record<string, any> }) {
    return this.svc.submitNeedsAssessment(req.user.id || req.user.userId, body.answers);
  }

  @Post('session')
  createSession(@Req() req: any, @Body() body: any) {
    return this.svc.createSession(req.user.id || req.user.userId, body);
  }

  @Get('psychologists')
  psychologists(
    @Req() req: any,
    @Query('city') city?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.svc.getSuggestedPsychologists(req.user.id || req.user.userId, city, sessionId);
  }

  @Get('slots')
  slots(@Query('city') city?: string, @Query('type') type?: string) {
    return this.svc.getAvailableSlots(city, type);
  }

  @Post('book-slot')
  bookSlot(@Req() req: any, @Body() body: { slotId: string; dominantNeed?: string; paymentMethod?: 'zarinpal' | 'wallet' }) {
    return this.svc.bookSlot(req.user.id || req.user.userId, body.slotId, body.dominantNeed, body.paymentMethod || 'zarinpal');
  }

  @Post('complete/:id')
  complete(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { postData?: any; referralPath?: string; notes?: string }
  ) {
    return this.svc.completeSession(req.user.id || req.user.userId, id, body.postData||{}, body.referralPath||'self_help', body.notes||'');
  }

  @Get('my-sessions')
  mySessions(@Req() req: any) {
    return this.svc.getMySessions(req.user.id || req.user.userId);
  }
}



