import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JourneyService } from './journey.service';

@Controller('journey')
@UseGuards(JwtAuthGuard)
export class JourneyController {
  constructor(private svc: JourneyService) {}

  @Get('my')
  myJourney(@Req() req: any) {
    return this.svc.getMyJourney(req.user.id || req.user.userId);
  }

  @Post('event')
  trackEvent(@Req() req: any, @Body() body: { eventType: string; metadata?: any }) {
    return this.svc.trackEvent(req.user.id || req.user.userId, body.eventType, body.metadata);
  }

  @Post('state')
  updateState(@Req() req: any, @Body() body: { phase: string; data?: any }) {
    return this.svc.updateState(req.user.id || req.user.userId, body.phase, body.data);
  }
}
