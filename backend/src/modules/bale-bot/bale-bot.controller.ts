import { Controller, Post, Get, Query, Body, Param, Logger, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { BaleBotService, getBaleWebhookSecret } from './bale-bot.service';
import { BaleInternalGuard } from '../../common/guards/bale-internal.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bale')
export class BaleBotController {
  private readonly logger = new Logger(BaleBotController.name);
  private readonly secret = getBaleWebhookSecret();

  constructor(private readonly svc: BaleBotService) {}

  @Post('webhook/:secret')
  async webhook(@Param('secret') s: string, @Body() update: any) {
    if (s !== this.secret) return { ok: false, error: 'invalid secret' };
    await this.svc.handleUpdate(update);
    return { ok: true };
  }

  @Post('notify-groups')
  @UseGuards(BaleInternalGuard)
  async notifyGroups(@Body() body: { eventId: string; groups: any[] }) {
    await this.svc.notifyGroups(body.eventId, body.groups);
    return { ok: true };
  }

  @Post('notify-admin')
  @UseGuards(BaleInternalGuard)
  async notifyAdmin(@Body() body: { message: string }) {
    await this.svc.notifyAdmin(body.message);
    return { ok: true };
  }

  @Post('send-event-reminder')
  @UseGuards(BaleInternalGuard)
  async sendEventReminder(@Body() body: { phone: string; booking: any }) {
    const sent = await this.svc.sendEventReminder(body.phone, body.booking);
    return { ok: true, sent };
  }

  @Post('send-payment-receipt')
  @UseGuards(BaleInternalGuard)
  async sendReceipt(@Body() body: { phone: string; payment: any }) {
    const sent = await this.svc.sendPaymentReceipt(body.phone, body.payment);
    return { ok: true, sent };
  }

  @Post('send-recommendations')
  @UseGuards(BaleInternalGuard)
  async sendRecs(@Body() body: { phone: string; events?: any[]; therapists?: any[] }) {
    const results: any = {};
    if (body.events?.length)
      results.events = await this.svc.sendEventRecommendations(body.phone, body.events);
    if (body.therapists?.length)
      results.therapists = await this.svc.sendPsychologistRecommendations(body.phone, body.therapists);
    return { ok: true, ...results };
  }

  @Post('send-otp')
  @UseGuards(BaleInternalGuard)
  async sendOtp(@Body() body: { phone: string; code: string }) {
    return this.svc.sendOtp(body.phone, body.code);
  }

  /** ساخت deep link برای اتصال بله — کاربر لاگین‌شده */
  @Get('generate-link')
  @UseGuards(JwtAuthGuard)
  async generateLink(@Query('phone') phone: string, @Req() req: any) {
    if (!phone) return { error: 'phone required' };
    const userPhone = (req.user?.mobileNumber || '').replace(/\D/g, '');
    const clean = phone.replace(/[^0-9]/g, '');
    if (userPhone && clean && userPhone !== clean) {
      throw new ForbiddenException('شماره موبایل نامعتبر است');
    }
    const botUsername = process.env.BALE_BOT_USERNAME || 'raaviiplatformbot';
    const param = 'otp_' + clean + '_' + Date.now();
    const deepLink = 'https://ble.ir/' + botUsername + '?start=' + param;
    return { deepLink, param };
  }

  @Get('test-send')
  @UseGuards(BaleInternalGuard)
  async testSend(@Query('phone') phone: string, @Query('code') code: string) {
    return this.svc.sendOtp(phone, code || '12345');
  }

  @Get('webhook-info')
  @UseGuards(BaleInternalGuard)
  async info() { return this.svc.getWebhookInfo(); }

  @Post('set-webhook')
  @UseGuards(BaleInternalGuard)
  async setWebhook(@Body('url') url: string) { return this.svc.setWebhook(url); }
}
