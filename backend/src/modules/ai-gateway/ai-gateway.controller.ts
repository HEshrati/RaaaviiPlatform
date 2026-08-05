import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiGatewayController {
  constructor(private readonly aiService: AiGatewayService) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Body() body: { messages: any[] }) {
    return this.aiService.chat(body.messages);
  }
}
