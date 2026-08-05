import { Controller, Post, Get, Patch, Body, Req, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FacilitatorService } from './facilitator.service';

@Controller('facilitator')
@UseGuards(JwtAuthGuard)
export class FacilitatorController {
  constructor(private svc: FacilitatorService) {}

  @Get('domains')
  domains() { return this.svc.getDomains(); }

  @Post('register')
  register(@Req() req: any, @Body() body: any) {
    return this.svc.registerProfile(req.user.id || req.user.userId, body);
  }

  @Post('accept-manifesto')
  acceptManifesto(@Req() req: any) {
    return this.svc.acceptManifesto(req.user.id || req.user.userId);
  }

  @Get('my-profile')
  myProfile(@Req() req: any) {
    return this.svc.getMyProfile(req.user.id || req.user.userId);
  }

  @Patch('my-profile')
  updateProfile(@Req() req: any, @Body() body: any) {
    return this.svc.updateMyProfile(req.user.id || req.user.userId, body);
  }

  @Get('status')
  status(@Req() req: any) {
    return this.svc.getStatus(req.user.id || req.user.userId);
  }

  @Get('my-events')
  myEvents(@Req() req: any) {
    return this.svc.getMyEvents(req.user.id || req.user.userId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard) @Roles('admin')
  adminAll(@Query('status') status?: string) { return this.svc.getAllForAdmin(status); }

  @Post('admin/approve/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  adminApprove(@Param('id') id: string, @Body() body: { note?: string }) {
    return this.svc.approveByAdmin(id, body.note);
  }

  @Post('admin/reject/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  adminReject(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.svc.rejectByAdmin(id, body.reason);
  }

  // ویژگی جدید: مسیر معادل psychologist-verify/admin/:id/request-revision که در پنل ادمین
  // تسهیلگر وجود نداشت.
  @Post('admin/request-revision/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  adminRequestRevision(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.svc.requestRevision(id, body.reason);
  }

  @Patch('admin/checklist/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  adminUpdateChecklist(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateChecklist(id, body);
  }
}



