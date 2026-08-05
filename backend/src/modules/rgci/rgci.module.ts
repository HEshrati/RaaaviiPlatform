import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RgciController } from './rgci.controller';
import { RgciService } from './rgci.service';
import { RgciProfileService } from './rgci-profile.service';
import { RgciCalculatorService } from './rgci-calculator.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import { RgciResponse } from './entities/rgci-response.entity';
import { PsychologicalOutcome } from './entities/psychological-outcome.entity';
import { ArticleRecommendation } from './entities/article-recommendation.entity';
import { RelationalExperienceQuality } from './entities/relational-experience-quality.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RgciResponse,
      PsychologicalOutcome,
      ArticleRecommendation,
      RelationalExperienceQuality,
    ]),
  ],
  controllers: [RgciController],
  providers: [
    RgciService,
    RgciProfileService,
    RgciCalculatorService,
    RecommendationService,
  ],
  exports: [RgciService, RgciProfileService, RgciCalculatorService],
})
export class RgciModule {}
