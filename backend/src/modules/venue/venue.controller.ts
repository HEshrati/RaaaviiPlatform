import { Controller, Post, Get, Patch, Body, Req, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VenueService } from './venue.service';

@Controller('venue')
@UseGuards(JwtAuthGuard)
export class VenueController {
  constructor(private svc: VenueService) {}

  @Get('options')
  options() { return this.svc.getOptions(); }

  @Post('register')
  register(@Req() req: any, @Body() body: any) {
    return this.svc.registerVenue(req.user.id || req.user.userId, body);
  }

  @Post('accept-terms')
  acceptTerms(@Req() req: any) {
    return this.svc.acceptTerms(req.user.id || req.user.userId);
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
    return this.svc.getVenueEvents(req.user.id || req.user.userId);
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

  @Post('admin/request-revision/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  adminRequestRevision(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.svc.requestRevisionByAdmin(id, body.reason);
  }
}
