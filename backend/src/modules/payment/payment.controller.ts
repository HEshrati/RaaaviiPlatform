import { Controller, Post, Get, Body, Query, Req, Res, UseGuards, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { Response } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  async requestPayment(
    @Req() req: any,
    @Body() body: {
      bookingId: string;
      amount: number;
      description?: string;
    }
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const ds = (this.paymentService as any).ds;

    const bookingRows = await ds.query(
      `SELECT b.id, b.user_id, b.amount_paid, b.status, b.locked_until, e.price
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       WHERE b.id = $1`,
      [body.bookingId],
    );
    if (!bookingRows.length) {
      throw new BadRequestException('رزرو یافت نشد');
    }
    const booking = bookingRows[0];
    if (booking.user_id !== userId) {
      throw new ForbiddenException('دسترسی غیرمجاز به این رزرو');
    }
    if (booking.status !== 'pending' || (booking.locked_until && new Date(booking.locked_until) <= new Date())) {
      throw new BadRequestException('مهلت پرداخت این رزرو پایان یافته است؛ رزرو جدید بسازید');
    }

    const expectedAmount = Number(booking.amount_paid || booking.price || 0);
    if (!expectedAmount || Number(body.amount) !== expectedAmount) {
      throw new BadRequestException('مبلغ پرداخت با رزرو مطابقت ندارد');
    }

    const userRow = await ds.query(
      `SELECT phone_number FROM users WHERE id=$1`, [userId]
    );
    const mobile = userRow[0]?.phone_number || '';

    return this.paymentService.requestPayment({
      userId,
      bookingId: body.bookingId,
      amount: expectedAmount,
      description: body.description || 'رزرو همنشینی راوی',
      mobile,
    });
  }

  @Get('verify')
  async verifyPayment(
    @Query('Authority') authority: string,
    @Query('Status') status: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.paymentService.verifyPayment(authority, status);

      if (result.success) {
        const query = new URLSearchParams();
        if (result.refId) query.set('refId', result.refId);
        if (result.bookingId) query.set('bookingId', result.bookingId);
        query.set('type', result.kind || (result.bookingId ? 'booking' : 'wallet_charge'));
        return res.redirect(
          `https://raaviiplatform.com/payment/success?${query.toString()}`
        );
      } else {
        return res.redirect(
          `https://raaviiplatform.com/payment/failed?message=${encodeURIComponent(result.message)}`
        );
      }
    } catch (err) {
      return res.redirect(
        `https://raaviiplatform.com/payment/failed?message=${encodeURIComponent('خطا در تأیید پرداخت')}`
      );
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(@Query('bookingId') bookingId: string, @Req() req: any) {
    const ds = (this.paymentService as any).ds;
    const userId = req.user?.userId || req.user?.id || req.user?.sub;

    const bookingRows = await ds.query(
      `SELECT user_id FROM bookings WHERE id=$1`,
      [bookingId],
    );
    if (!bookingRows.length) {
      return { status: 'not_found' };
    }
    if (bookingRows[0].user_id !== userId) {
      throw new ForbiddenException('دسترسی غیرمجاز');
    }

    const rows = await ds.query(
      `SELECT status, ref_id, amount, created_at FROM payments WHERE booking_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [bookingId]
    );
    return rows[0] || { status: 'not_found' };
  }
}
