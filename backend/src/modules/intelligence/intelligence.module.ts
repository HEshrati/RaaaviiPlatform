import { Module } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { RecommendationEngineService } from './recommendation-engine.service';

import { IntelligenceController } from './intelligence.controller';

@Module({
  controllers: [IntelligenceController],
  providers: [IntelligenceService, RecommendationEngineService],
  exports: [IntelligenceService, RecommendationEngineService],
})
export class IntelligenceModule {}
