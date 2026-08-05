import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { isAdminUser } from '../admin/admin.controller';
import { FinancialReportService } from './financial-report.service';

@Controller('admin/financial')
@UseGuards(JwtAuthGuard)
export class FinancialReportController {
  constructor(private readonly reportService: FinancialReportService) {}

  private requireAdmin(req: any) {
    if (!isAdminUser(req.user)) {
      throw new ForbiddenException('دسترسی ادمین لازم است');
    }
  }

  /** خلاصه کلی: تعداد و مبلغ به تفکیک وضعیت + نرخ موفقیت */
  @Get('summary')
  async getSummary(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.requireAdmin(req);
    return this.reportService.getSummary({ from, to });
  }

  /** روند درآمد روزانه - برای نمودار */
  @Get('daily-revenue')
  async getDailyRevenue(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.requireAdmin(req);
    return this.reportService.getDailyRevenue({ from, to });
  }

  /** تفکیک بر اساس درگاه پرداخت */
  @Get('by-gateway')
  async getByGateway(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.requireAdmin(req);
    return this.reportService.getByGateway({ from, to });
  }

  /** لیست تراکنش‌های ناموفق - برای پیگیری */
  @Get('failed')
  async getFailedTransactions(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    this.requireAdmin(req);
    return this.reportService.getFailedTransactions({
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /** لیست کامل تراکنش‌ها با فیلتر و صفحه‌بندی - برای جدول ادمین */
  @Get('transactions')
  async getTransactions(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.requireAdmin(req);
    return this.reportService.getTransactionsList({
      from,
      to,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /** خروجی CSV برای دانلود */
  @Get('export-csv')
  async exportCsv(
    @Req() req: any,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.requireAdmin(req);
    const csv = await this.reportService.exportTransactionsCsv({ from, to });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="raavi-transactions-${Date.now()}.csv"`);
    // BOM برای نمایش صحیح فارسی در اکسل
    res.send('\uFEFF' + csv);
  }
}
