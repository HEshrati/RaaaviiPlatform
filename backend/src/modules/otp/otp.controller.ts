import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OtpService } from './otp.service';
import { BotSecretGuard } from '../../common/guards/bot-secret.guard';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  /** فقط سرویس‌های داخلی (ربات) — OTP خام در response نیست */
  @Get('recent')
  @UseGuards(BotSecretGuard)
  async getRecentByMobile(@Query('mobileNumber') mobileNumber: string) {
    const otp = await this.otpService.getRecentByMobile(mobileNumber);
    if (!otp) return { found: false };
    return {
      found: true,
      mobileNumber: otp.mobileNumber,
      expiresAt: otp.expiresAt,
      isUsed: otp.isUsed,
    };
  }

  @Post('send')
  @UseGuards(BotSecretGuard)
  async sendOtp(@Body('mobileNumber') mobileNumber: string) {
    await this.otpService.resendOtp(mobileNumber);
    return { message: 'OTP sent successfully' };
  }

  @Post('verify')
  @UseGuards(BotSecretGuard)
  async verifyOtp(
    @Body('mobileNumber') mobileNumber: string,
    @Body('code') code: string,
  ) {
    const isValid = await this.otpService.verifyOtp(mobileNumber, code);
    return { isValid };
  }
}
