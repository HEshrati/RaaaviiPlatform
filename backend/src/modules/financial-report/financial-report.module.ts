import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { FinancialReportService } from './financial-report.service';
import { FinancialReportController } from './financial-report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [FinancialReportController],
  providers: [FinancialReportService],
  exports: [FinancialReportService],
})
export class FinancialReportModule {}
