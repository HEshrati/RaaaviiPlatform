import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { isAdminUser } from '../admin/admin.controller';
import { HamzisteService } from './hamzist.service';
import { CreateGroupDto, ScheduleSessionDto, MarkAttendanceDto } from './dto/hamzist.dto';

@Controller('hamzist')
export class HamzistController {
  constructor(private readonly hamzistService: HamzisteService) {}

  // ── عمومی: مرور گروه‌ها ──────────────────────────────────────────
  @Get('groups')
  @UseGuards(OptionalJwtGuard)
  async listGroups(
    @Query('topic') topic?: string,
    @Query('city') city?: string,
    @Query('mode') mode?: string,
  ) {
    return this.hamzistService.listActiveGroups({ topic, city, mode });
  }

  @Get('groups/:id')
  @UseGuards(OptionalJwtGuard)
  async getGroupDetail(@Param('id') id: string) {
    return this.hamzistService.getGroupDetail(id);
  }

  // ── عضویت کاربر ───────────────────────────────────────────────
  @Post('groups/:id/join')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async joinGroup(@Param('id') groupId: string, @Body() body: any, @Req() req: any) {
    // FIX: forward paymentMethod از body
    return this.hamzistService.joinGroup(req.user.id, groupId, body?.paymentMethod || 'zarinpal');
  }

  @Post('groups/:id/leave')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async leaveGroup(@Param('id') groupId: string, @Req() req: any) {
    return this.hamzistService.leaveGroup(req.user.id, groupId);
  }

  @Get('my-memberships')
  @UseGuards(JwtAuthGuard)
  async getMyMemberships(@Req() req: any) {
    return this.hamzistService.getMyMemberships(req.user.id);
  }

  /**
   * تأیید عضویت پس از پرداخت موفق.
   * این endpoint باید توسط callback پرداخت (بعد از verify زرین‌پال) صدا زده شود،
   * نه مستقیماً توسط کاربر. اینجا فقط برای تکمیل luôp قرار داده شده —
   * در ادغام واقعی، payment.controller.ts باید بعد از verify موفق این متد سرویس را صدا بزند.
   */
  @Post('memberships/:membershipId/confirm-payment')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmPayment(
    @Param('membershipId') membershipId: string,
    @Body() body: { payment_id: string },
    @Req() req: any,
  ) {
    // فقط ادمین یا سیستم پرداخت داخلی باید این را صدا بزند
    if (!isAdminUser(req.user)) {
      throw new ForbiddenException('این عملیات باید از طریق سیستم پرداخت انجام شود');
    }
    return this.hamzistService.confirmMembershipPayment(membershipId, body.payment_id);
  }

  // ── مدیریت فسیلیتیتور ────────────────────────────────────────
  @Post('groups')
  @UseGuards(JwtAuthGuard)
  async createGroup(@Body() dto: CreateGroupDto, @Req() req: any) {
    if (!isAdminUser(req.user)) {
      throw new ForbiddenException('ساخت گروه فقط برای ادمین مجاز است');
    }
    return this.hamzistService.createGroup(req.user.id, dto, true);
  }

  @Patch('groups/:id')
  @UseGuards(JwtAuthGuard)
  async updateGroup(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.hamzistService.updateGroup(id, req.user.id, dto, isAdminUser(req.user));
  }

  @Post('groups/:id/close')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async closeGroup(@Param('id') id: string, @Req() req: any) {
    return this.hamzistService.closeGroup(id, req.user.id, isAdminUser(req.user));
  }

  @Get('my-groups')
  @UseGuards(JwtAuthGuard)
  async getMyGroups(@Req() req: any) {
    return this.hamzistService.getMyGroups(req.user.id);
  }

  @Get('groups/:id/members')
  @UseGuards(JwtAuthGuard)
  async getGroupMembers(@Param('id') id: string, @Req() req: any) {
    return this.hamzistService.getGroupMembers(id, req.user.id, isAdminUser(req.user));
  }

  @Delete('memberships/:membershipId')
  @UseGuards(JwtAuthGuard)
  async removeMember(@Param('membershipId') membershipId: string, @Req() req: any) {
    return this.hamzistService.removeMember(membershipId, req.user.id, isAdminUser(req.user));
  }

  @Post('groups/:id/sessions')
  @UseGuards(JwtAuthGuard)
  async scheduleSession(
    @Param('id') groupId: string,
    @Body() dto: ScheduleSessionDto,
    @Req() req: any,
  ) {
    return this.hamzistService.scheduleSession(groupId, req.user.id, dto, isAdminUser(req.user));
  }

  @Post('sessions/:sessionId/attendance')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAttendance(
    @Param('sessionId') sessionId: string,
    @Body() dto: MarkAttendanceDto,
    @Req() req: any,
  ) {
    return this.hamzistService.markAttendance(
      sessionId, dto.attendance, req.user.id, isAdminUser(req.user),
    );
  }

  // ── ادمین: نظارت کلی ─────────────────────────────────────────
  @Get('admin/upcoming-payments')
  @UseGuards(JwtAuthGuard)
  async getUpcomingPayments(@Req() req: any, @Query('days') days?: string) {
    if (!isAdminUser(req.user)) {
      throw new ForbiddenException('دسترسی ادمین لازم است');
    }
    return this.hamzistService.getUpcomingPaymentsDue(days ? parseInt(days, 10) : undefined);
  }
}
