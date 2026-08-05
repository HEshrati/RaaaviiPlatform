import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from './entities/feedback.entity';
import { Who5Service } from './who5.service';
import { PostFeedbackService } from './post-feedback.service';
import { Who5Controller } from './who5.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback])],
  controllers: [Who5Controller],
  providers: [Who5Service, PostFeedbackService],
  exports: [Who5Service, PostFeedbackService],
})
export class FeedbacksModule {}
