import { Controller, Get, Post, Req, UseGuards, Param, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IntelligenceService } from './intelligence.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { isAdminUser } from '../admin/admin.controller';


@Controller('intelligence')
@UseGuards(JwtAuthGuard)
export class IntelligenceController {
  constructor(
    private readonly svc: IntelligenceService,
    private readonly engine: RecommendationEngineService,
  ) {}

  @Get('my-profile')
  async myProfile(@Req() req: any) {
    return this.svc.getFullProfile(req.user.userId || req.user.id || req.user.sub);
  }

  @Get('article-recs')
  async articleRecs(@Req() req: any) {
    return this.svc.getArticleRecommendations(req.user.userId || req.user.id || req.user.sub);
  }

  @Get('event-recs')
  async eventRecs(@Req() req: any) {
    return this.svc.getEventRecommendations(req.user.userId || req.user.id || req.user.sub);
  }

  @Get('next-tests')
  async nextTests(@Req() req: any) {
    return this.svc.getNextRecommendedTests(req.user.userId || req.user.id || req.user.sub);
  }

  @Post('sync')
  async sync(@Req() req: any) {
    await this.svc.fullSync(req.user.userId || req.user.id || req.user.sub);
    return { success: true };
  }

  @Get('phases')
  async phases(@Req() req: any) {
    const p = await this.svc.getFullProfile(req.user.userId || req.user.id || req.user.sub);
    return p.phases;
  }

  @Get('my-recommendations')
  async myRecs(@Req() req: any) {
    const uid = req.user?.userId || req.user?.id || req.user?.sub;
    return this.engine.getUserRecommendations(uid);
  }

  @Post('trigger-event/:id')
  async triggerEvent(@Param('id') id: string, @Req() req: any) {
    if (!isAdminUser(req.user)) {
      throw new ForbiddenException('دسترسی ادمین لازم است');
    }
    await this.engine.onNewEvent(id);
    return { success: true };
  }
}