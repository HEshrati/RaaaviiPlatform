import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { RgciCalculatorService } from '../rgci/rgci-calculator.service';
import { MatchingScheduler } from './matching.scheduler';

@Module({
  controllers: [MatchingController],
  providers: [MatchingService, MatchingScheduler, RgciCalculatorService],
})
export class MatchingModule {}
