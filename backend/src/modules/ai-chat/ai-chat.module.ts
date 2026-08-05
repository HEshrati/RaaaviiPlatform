import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiSessionsController } from './ai-sessions.controller';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { TestResult } from '../test-results/entities/test-result.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { UserBehaviorEvent } from '../crm/entities/user-behavior-event.entity';
import { CrmAiAlert } from '../crm/entities/crm-ai-alert.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestResult, Profile, UserBehaviorEvent, CrmAiAlert, User]),
  ],
  controllers: [AiChatController, AiSessionsController],
  providers: [AiChatService],
})
export class AiChatModule {}
