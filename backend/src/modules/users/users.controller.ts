import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get('me/stats')
  getStats(@Request() req) {
    return this.usersService.getStats(req.user.userId);
  }

  @Patch('me')
  updateMe(@Request() req, @Body() body: { name?: string; phoneNumber?: string }) {
    return this.usersService.updateMe(req.user.userId, body);
  }
}
