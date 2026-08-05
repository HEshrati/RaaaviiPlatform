import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BaleGroupService } from './bale-group.service';
import { BaleBotService } from './bale-bot.service';
import { BaleBotController } from './bale-bot.controller';
import { BaleSchedulerService } from './bale-scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [BaleBotService, BaleGroupService, BaleSchedulerService],
  controllers: [BaleBotController],
  exports: [BaleBotService, BaleGroupService],
})
export class BaleBotModule {}
