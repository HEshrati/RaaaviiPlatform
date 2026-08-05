import { Response } from 'express';
import { Controller, Post, Body, Req, Res, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiChatService } from './ai-chat.service';

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('user')
  @UseGuards(JwtAuthGuard)
  async userChat(@Req() req: any, @Body() body: { messages: { role: string; content: string }[] }) {
    return this.aiChatService.userChat(req.user.id, body.messages);
  }

  @Post('user/stream')
  @UseGuards(JwtAuthGuard)
  async userChatStream(
    @Req() req: any,
    @Body() body: { messages: { role: string; content: string }[] },
    @Res() res: Response,
  ) {
    return this.aiChatService.streamUserChat(req.user.id, body.messages, res);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminChat(@Body() body: { messages: { role: string; content: string }[] }) {
    return this.aiChatService.adminChat(body.messages);
  }

  @Post('admin/user/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminUserChat(
    @Param('id') userId: string,
    @Body() body: { messages: { role: string; content: string }[] },
  ) {
    return this.aiChatService.adminUserChat(userId, body.messages);
  }
}

// ── Chat Session endpoints ──────────────────────────────────────
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// این رو به کلاس اضافه کن — یا یه controller جداگانه بساز
