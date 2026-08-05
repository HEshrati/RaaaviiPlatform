import { Controller, Post, Get, Body, UseGuards, Request, Req, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() body: { phone?: string; mobile?: string }) {
    const phoneNumber = body.phone || body.mobile;
    if (!phoneNumber) {
      throw new BadRequestException('phone or mobile is required');
    }
    return await this.authService.sendOtp(phoneNumber);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: { phone: string; code: string; name?: string; role?: string; medicalCode?: string }, @Req() req: any) {
    return await this.authService.verifyOtp(body.phone, body.code, body.name, {
      userAgent: req.headers?.['user-agent'],
      ip: req.ip,
    }, body.role, body.medicalCode);
  }

  @Post('check-phone')
  @HttpCode(HttpStatus.OK)
  async checkPhone(@Body() body: { phone: string }) {
    const exists = await this.authService.checkPhoneExists(body.phone);
    return { exists };
  }

  @Post('check-name')
  @HttpCode(HttpStatus.OK)
  async checkName(@Body() body: { name: string }) {
    const exists = await this.authService.checkNameExists(body.name);
    return { exists };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return await this.authService.getProfile(req.user.id);
  }

  @Post('mark-test-taken')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markTestTaken(@Request() req) {
    return await this.authService.markTestTaken(req.user.id);
  }

  /**
   * تمدید access token با استفاده از refresh token
   * فرانت باید هنگام دریافت 401، یک بار این endpoint را صدا بزند
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refresh_token: string }, @Req() req: any) {
    if (!body.refresh_token) {
      throw new BadRequestException('refresh_token الزامی است');
    }
    return await this.authService.refreshAccessToken(body.refresh_token, {
      userAgent: req.headers?.['user-agent'],
      ip: req.ip,
    });
  }

  /** خروج از همین دستگاه - باطل کردن یک refresh token مشخص */
  @Post('logout-device')
  @HttpCode(HttpStatus.OK)
  async logoutDevice(@Body() body: { refresh_token: string }) {
    await this.authService.logoutDevice(body.refresh_token);
    return { success: true, message: 'از این دستگاه خارج شدید' };
  }

  /** خروج از همه دستگاه‌ها (مثلاً بعد از فعالیت مشکوک) */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Request() req) {
    await this.authService.logoutAllDevices(req.user.id);
    return { success: true, message: 'از همه دستگاه‌ها خارج شدید' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    return { success: true, message: 'با موفقیت خارج شدید' };
  }
}
