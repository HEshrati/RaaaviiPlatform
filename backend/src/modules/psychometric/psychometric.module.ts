import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PsychometricService } from './psychometric.service';
import { CompatibilityService } from './compatibility.service';
import { PsychometricController } from './psychometric.controller';
import { TestResult } from '../test-results/entities/test-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TestResult])],
  providers: [PsychometricService, CompatibilityService],
  controllers: [PsychometricController],
  exports: [PsychometricService, CompatibilityService],
})
export class PsychometricModule {}
