import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';

export interface FinancialSummaryQuery {
  from?: string; // ISO date
  to?: string;   // ISO date
  status?: string;
  gateway?: string;
}

@Injectable()
export class FinancialReportService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private dateRange(from?: string, to?: string) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { fromDate, toDate };
  }

  /**
   * خلاصه کلی: تعداد و مبلغ به تفکیک وضعیت (موفق/ناموفق/در انتظار/بازگشتی)
   */
  async getSummary(query: FinancialSummaryQuery) {
    const { fromDate, toDate } = this.dateRange(query.from, query.to);

    const rows = await this.dataSource.query(
      `
      SELECT
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payments
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY status
      ORDER BY status
      `,
      [fromDate, toDate],
    );

    const totalRow = await this.dataSource.query(
      `
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END), 0) as total_refunded,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END), 0) as avg_transaction_value
      FROM payments
      WHERE created_at BETWEEN $1 AND $2
      `,
      [fromDate, toDate],
    );

    const byStatus = rows.reduce((acc: any, r: any) => {
      acc[r.status] = { count: Number(r.count), total_amount: Number(r.total_amount) };
      return acc;
    }, {});

    const successCount = byStatus['completed']?.count || 0;
    const failedCount = byStatus['failed']?.count || 0;
    const totalAttempts = successCount + failedCount;
    const successRate = totalAttempts > 0 ? Math.round((successCount / totalAttempts) * 100) : 0;

    return {
      period: { from: fromDate, to: toDate },
      by_status: byStatus,
      total_count: Number(totalRow[0]?.total_count || 0),
      total_revenue: Number(totalRow[0]?.total_revenue || 0),
      total_refunded: Number(totalRow[0]?.total_refunded || 0),
      net_revenue: Number(totalRow[0]?.total_revenue || 0) - Number(totalRow[0]?.total_refunded || 0),
      avg_transaction_value: Math.round(Number(totalRow[0]?.avg_transaction_value || 0)),
      success_rate_percent: successRate,
    };
  }

  /**
   * روند درآمد روزانه (برای نمودار)
   */
  async getDailyRevenue(query: FinancialSummaryQuery) {
    const { fromDate, toDate } = this.dateRange(query.from, query.to);

    return this.dataSource.query(
      `
      SELECT
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as revenue
      FROM payments
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      `,
      [fromDate, toDate],
    );
  }

  /**
   * تفکیک بر اساس درگاه پرداخت (zarinpal, wallet, و غیره)
   */
  async getByGateway(query: FinancialSummaryQuery) {
    const { fromDate, toDate } = this.dateRange(query.from, query.to);

    return this.dataSource.query(
      `
      SELECT
        COALESCE(payment_gateway, payment_method, 'نامشخص') as gateway,
        COUNT(*) as count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as revenue,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count
      FROM payments
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY COALESCE(payment_gateway, payment_method, 'نامشخص')
      ORDER BY revenue DESC
      `,
      [fromDate, toDate],
    );
  }

  /**
   * لیست تراکنش‌های ناموفق (برای بررسی و پیگیری)
   */
  async getFailedTransactions(query: FinancialSummaryQuery & { limit?: number }) {
    const { fromDate, toDate } = this.dateRange(query.from, query.to);
    const limit = query.limit || 100;

    return this.dataSource.query(
      `
      SELECT
        p.id, p.user_id, p.amount, p.payment_gateway, p.payment_method,
        p.gateway_reference, p.description, p.created_at,
        u.phone_number as user_phone, u.name as user_name
      FROM payments p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.status = 'failed'
        AND p.created_at BETWEEN $1 AND $2
      ORDER BY p.created_at DESC
      LIMIT $3
      `,
      [fromDate, toDate, limit],
    );
  }

  /**
   * لیست کامل تراکنش‌ها با فیلتر و صفحه‌بندی (برای جدول ادمین)
   */
  async getTransactionsList(params: {
    from?: string;
    to?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { fromDate, toDate } = this.dateRange(params.from, params.to);
    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 200);
    const offset = (page - 1) * limit;

    const queryParams: any[] = [fromDate, toDate];
    let statusFilter = '';
    if (params.status) {
      queryParams.push(params.status);
      statusFilter = `AND p.status = $${queryParams.length}`;
    }

    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as total
      FROM payments p
      WHERE p.created_at BETWEEN $1 AND $2 ${statusFilter}
      `,
      queryParams,
    );

    queryParams.push(limit, offset);
    const rows = await this.dataSource.query(
      `
      SELECT
        p.id, p.user_id, p.booking_id, p.amount, p.currency, p.status,
        p.payment_gateway, p.payment_method, p.gateway_reference,
        p.gateway_tracking_code, p.description, p.paid_at, p.created_at,
        p.refunded_at, p.refund_amount,
        u.phone_number as user_phone, u.name as user_name
      FROM payments p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.created_at BETWEEN $1 AND $2 ${statusFilter}
      ORDER BY p.created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `,
      queryParams,
    );

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: Number(countResult[0]?.total || 0),
        total_pages: Math.ceil(Number(countResult[0]?.total || 0) / limit),
      },
    };
  }

  /**
   * خروجی CSV از تراکنش‌ها (برای دانلود توسط ادمین)
   */
  async exportTransactionsCsv(query: FinancialSummaryQuery): Promise<string> {
    const { fromDate, toDate } = this.dateRange(query.from, query.to);

    const rows = await this.dataSource.query(
      `
      SELECT
        p.id, p.created_at, p.status, p.amount, p.currency,
        p.payment_gateway, p.gateway_reference, p.gateway_tracking_code,
        u.phone_number as user_phone, u.name as user_name
      FROM payments p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.created_at BETWEEN $1 AND $2
      ORDER BY p.created_at DESC
      `,
      [fromDate, toDate],
    );

    const headers = ['شناسه', 'تاریخ', 'وضعیت', 'مبلغ', 'ارز', 'درگاه', 'کد پیگیری', 'شماره موبایل', 'نام کاربر'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      const line = [
        r.id,
        new Date(r.created_at).toISOString(),
        r.status,
        r.amount,
        r.currency || 'IRR',
        r.payment_gateway || '',
        r.gateway_tracking_code || '',
        r.user_phone || '',
        `"${(r.user_name || '').replace(/"/g, '""')}"`,
      ].join(',');
      csvLines.push(line);
    }

    return csvLines.join('\n');
  }
}
