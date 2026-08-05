import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as https from 'https';
import { mutationRows } from '../../common/database/query-result';

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || '';
const IS_SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';

const PROD_REQUEST  = 'https://api.zarinpal.com/pg/v4/payment/request.json';
const PROD_VERIFY   = 'https://api.zarinpal.com/pg/v4/payment/verify.json';
const PROD_STARTPAY = 'https://www.zarinpal.com/pg/StartPay/';
const SAND_REQUEST  = 'https://sandbox.zarinpal.com/pg/v4/payment/request.json';
const SAND_VERIFY   = 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json';
const SAND_STARTPAY = 'https://sandbox.zarinpal.com/pg/StartPay/';
const CALLBACK_URL = process.env.ZARINPAL_CALLBACK_URL || 'https://raaviiplatform.com/api/payment/verify';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  async requestPayment(params: {
    userId: string;
    bookingId?: string;
    amount: number;
    description: string;
    mobile?: string;
    email?: string;
    paymentMethod?: string;
    type?: 'booking' | 'wallet_charge';
  }): Promise<{ authority: string; paymentUrl: string }> {

    const amountRial = params.amount * 10;

    const metadata: any = {};
    if (params.mobile && params.mobile.length >= 10) metadata.mobile = params.mobile;
    if (params.email && params.email.includes('@')) metadata.email = params.email;
    if (params.type) metadata.type = params.type;

    const requestPayload: any = {
      merchant_id: MERCHANT_ID,
      amount: amountRial,
      callback_url: CALLBACK_URL,
      description: params.description,
    };
    if (Object.keys(metadata).length > 0) requestPayload.metadata = metadata;

    const body = JSON.stringify(requestPayload);

    if (!IS_SANDBOX && MERCHANT_ID) {
      this.logger.log(`Trying production Zarinpal: amount=${params.amount} rial=${amountRial} type=${params.type || 'booking'}`);
      try {
        const result = await this.postJson(PROD_REQUEST, body);
        if (result?.data?.code === 100) {
          const authority = result.data.authority;
          await this.savePayment(params, authority, metadata);
          this.logger.log(`Production payment OK: authority=${authority}`);
          return { authority, paymentUrl: `${PROD_STARTPAY}${authority}` };
        }
        const errCode = result?.data?.code || result?.errors?.code || 'unknown';
        const errMsg = result?.errors?.message || '';
        this.logger.warn(`Production Zarinpal failed: code=${errCode} msg=${errMsg}`);
      } catch (err) {
        this.logger.warn(`Production Zarinpal error: ${err.message}`);
      }
    }

    if (process.env.NODE_ENV !== 'production' || IS_SANDBOX) {
      this.logger.log(`Using sandbox Zarinpal: amount=${params.amount} rial=${amountRial}`);
      const sandBody = JSON.stringify(requestPayload);
      const sandResult = await this.postJson(SAND_REQUEST, sandBody);

      if (sandResult?.data?.code !== 100) {
        const errCode = sandResult?.data?.code || sandResult?.errors?.code || 'unknown';
        const errMsg = sandResult?.errors?.message || '';
        this.logger.error(`Sandbox Zarinpal also failed: code=${errCode} msg=${errMsg} full=${JSON.stringify(sandResult)}`);
        throw new Error(`خطای زرین‌پال: ${errMsg || 'کد ' + errCode}`);
      }

      const authority = sandResult.data.authority;
      await this.savePayment(params, authority, metadata);
      this.logger.log(`Sandbox payment OK: authority=${authority}`);

      return { authority, paymentUrl: `${SAND_STARTPAY}${authority}` };
    }

    throw new Error('درگاه پرداخت در دسترس نیست');
  }

  private async savePayment(params: any, authority: string, metadata: any) {
    await this.ds.query(`
      INSERT INTO payments (user_id, booking_id, authority, amount, currency, payment_method, payment_gateway, status, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'IRR', $5, 'zarinpal', 'pending', $6, NOW(), NOW())
      ON CONFLICT (authority) DO NOTHING
    `, [
      params.userId,
      params.bookingId || null,
      authority,
      params.amount,
      params.paymentMethod || 'online',
      JSON.stringify(metadata || {}),
    ]);
  }

  async verifyPayment(authority: string, status: string): Promise<{
    success: boolean;
    refId?: string;
    bookingId?: string;
    kind?: 'booking' | 'wallet_charge' | 'psychologist_booking';
    message: string;
  }> {
    if (status !== 'OK') {
      await this.ds.query(
        `UPDATE payments SET status='cancelled', updated_at=NOW()
         WHERE authority=$1 AND status IN ('pending', 'verifying')`,
        [authority]
      );
      return { success: false, message: 'پرداخت توسط کاربر لغو شد' };
    }

    const rows = await this.ds.query(
      `SELECT amount, booking_id, user_id, status, ref_id, metadata FROM payments WHERE authority=$1`,
      [authority]
    );
    if (!rows.length) {
      return { success: false, message: 'تراکنش یافت نشد' };
    }

    let payment = rows[0];
    if (payment.status === 'verified' || payment.status === 'completed') {
      return {
        success: true, refId: payment.ref_id, bookingId: payment.booking_id,
        kind: payment.metadata?.type || (payment.booking_id ? 'booking' : undefined), message: 'قبلاً تایید شده',
      };
    }
    if (payment.status !== 'pending') {
      return { success: false, bookingId: payment.booking_id, message: 'وضعیت این پرداخت در حال بررسی است' };
    }

    // callback درگاه ممکن است بیش از یک‌بار یا هم‌زمان ارسال شود. فقط یک درخواست
    // حق ورود به مسیر تأیید و افزایش ظرفیت را دارد.
    const claimResult = await this.ds.query(
      `UPDATE payments SET status='verifying', updated_at=NOW()
       WHERE authority=$1 AND status='pending'
       RETURNING amount, booking_id, user_id, status, ref_id, metadata`,
      [authority],
    );
    const claimed = mutationRows(claimResult);
    if (!claimed.length) {
      const current = await this.ds.query(
        `SELECT status, ref_id, booking_id, metadata FROM payments WHERE authority=$1`, [authority],
      );
      if (current[0]?.status === 'verified' || current[0]?.status === 'completed') {
        return {
          success: true, refId: current[0].ref_id, bookingId: current[0].booking_id,
          kind: current[0].metadata?.type || (current[0].booking_id ? 'booking' : undefined), message: 'قبلاً تایید شده',
        };
      }
      return { success: false, message: 'پرداخت در حال تأیید است' };
    }
    payment = claimed[0];

    const amountRial = payment.amount * 10;
    const isSandboxAuthority = authority.startsWith('S');
    const verifyUrl = isSandboxAuthority ? SAND_VERIFY : PROD_VERIFY;

    const body = JSON.stringify({
      merchant_id: MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      amount: amountRial,
      authority,
    });

    const result = await this.postJson(verifyUrl, body);
    const code = result?.data?.code;

    if (code === 100 || code === 101) {
      const refId = String(result.data.ref_id || '');

      const metadata = payment.metadata || {};

      if (metadata.type === 'wallet_charge') {
        await this.ds.transaction(async (manager) => {
          await manager.query(
            `UPDATE users SET credits_balance=COALESCE(credits_balance,0)+$1,updated_at=NOW() WHERE id=$2`,
            [payment.amount, payment.user_id],
          );
          await manager.query(
            `UPDATE payments SET status='completed',ref_id=$1,gateway_reference=$1,paid_at=NOW(),updated_at=NOW()
             WHERE authority=$2 AND status='verifying'`,
            [refId, authority],
          );
        });
        this.logger.log(`Wallet charged: user=${payment.user_id} amount=${payment.amount} ref=${refId}`);
        return { success: true, refId, kind: 'wallet_charge', message: `کیف پول با موفقیت شارژ شد — کد پیگیری: ${refId}` };
      }

      if (metadata.type === 'psychologist_booking') {
        const slotId = metadata.slotId;
        try {
          await this.ds.query(
            `UPDATE psychologist_bookings SET status='confirmed', updated_at=NOW() WHERE slot_id=$1 AND user_id=$2`,
            [slotId, payment.user_id]
          );
          await this.ds.query(
            `UPDATE psychologist_time_slots SET status='reserved' WHERE id=$1`,
            [slotId]
          );
          if (metadata.sessionId) {
            await this.ds.query(
              `UPDATE hamravan_sessions SET status='booked' WHERE id=$1`,
              [metadata.sessionId]
            );
          }
        } catch (e) {
          this.logger.error(`خطا در تایید رزرو روانشناس: ${e.message}`);
        }
        await this.ds.query(
          `UPDATE payments SET status='completed',ref_id=$1,gateway_reference=$1,paid_at=NOW(),updated_at=NOW() WHERE authority=$2`,
          [refId, authority]
        );
        this.logger.log(`Psychologist booking confirmed via payment: user=${payment.user_id} slot=${slotId} ref=${refId}`);
        return { success: true, refId, kind: 'psychologist_booking', message: `پرداخت موفق و جلسه رزرو شد — کد پیگیری: ${refId}` };
      }

      if (payment.booking_id) {
        const confirmation = await this.ds.transaction(async (manager) => {
          const bookingRows = await manager.query(
            `SELECT event_id,user_id,status,metadata FROM bookings WHERE id=$1 FOR UPDATE`, [payment.booking_id],
          );
          const booking = bookingRows[0];
          if (!booking) {
            await manager.query(`UPDATE payments SET status='needs_review',ref_id=$2,gateway_reference=$2,updated_at=NOW() WHERE authority=$1`, [authority, refId]);
            return { ok: false, message: 'رزرو مرتبط با پرداخت یافت نشد' };
          }
          if (booking.status === 'confirmed') {
            await manager.query(
              `UPDATE payments SET status='completed',ref_id=$1,gateway_reference=$1,paid_at=COALESCE(paid_at,NOW()),updated_at=NOW() WHERE authority=$2`,
              [refId, authority],
            );
            return { ok: true, eventId: booking.event_id };
          }
          if (!['pending', 'expired', 'payment_review'].includes(booking.status)) {
            await manager.query(`UPDATE payments SET status='needs_review',ref_id=$2,gateway_reference=$2,updated_at=NOW() WHERE authority=$1`, [authority, refId]);
            return { ok: false, message: 'وضعیت رزرو برای تأیید پرداخت معتبر نیست؛ پشتیبانی پیگیری می‌کند' };
          }
          const otherActive = await manager.query(
            `SELECT 1 FROM bookings WHERE event_id=$1 AND user_id=$2 AND id<>$3
             AND status NOT IN ('cancelled','expired') LIMIT 1`,
            [booking.event_id, booking.user_id, payment.booking_id],
          );
          if (otherActive.length) {
            await manager.query(`UPDATE payments SET status='needs_review',ref_id=$2,gateway_reference=$2,updated_at=NOW() WHERE authority=$1`, [authority, refId]);
            return { ok: false, message: 'برای این رویداد رزرو فعال دیگری وجود دارد؛ پشتیبانی پرداخت را پیگیری می‌کند' };
          }
          const bookingMetadata = typeof booking.metadata === 'string'
            ? JSON.parse(booking.metadata || '{}') : (booking.metadata || {});
          const quantity = Number(bookingMetadata.quantity || 1);
          const slots = (Number.isInteger(quantity) && quantity > 0 ? quantity : 1)
            + (bookingMetadata.plusOneUserId ? 1 : 0);
          const eventRows = await manager.query(`SELECT current_bookings,capacity FROM events WHERE id=$1 FOR UPDATE`, [booking.event_id]);
          if (!eventRows.length || Number(eventRows[0].current_bookings) + slots > Number(eventRows[0].capacity)) {
            await manager.query(`UPDATE payments SET status='needs_review',ref_id=$2,gateway_reference=$2,updated_at=NOW() WHERE authority=$1`, [authority, refId]);
            await manager.query(`UPDATE bookings SET status='payment_review',updated_at=NOW() WHERE id=$1`, [payment.booking_id]);
            return { ok: false, message: 'پرداخت ثبت شد اما ظرفیت رویداد تکمیل است؛ پشتیبانی پیگیری می‌کند' };
          }
          await manager.query(
            `UPDATE events SET current_bookings=current_bookings+$2,updated_at=NOW() WHERE id=$1`, [booking.event_id, slots],
          );
          await manager.query(
            `UPDATE bookings SET status='confirmed',payment_status='paid',confirmed_at=NOW(),updated_at=NOW() WHERE id=$1`, [payment.booking_id],
          );
          await manager.query(
            `UPDATE payments SET status='completed',ref_id=$1,gateway_reference=$1,paid_at=NOW(),updated_at=NOW() WHERE authority=$2`, [refId, authority],
          );
          await manager.query(
            `INSERT INTO match_queue (event_id,user_id,status,joined_at)
             VALUES ($1,$2,CASE WHEN EXISTS (SELECT 1 FROM user_rgci_profiles WHERE user_id=$2)
               THEN 'waiting' ELSE 'needs_profile_completion' END,NOW())
             ON CONFLICT (event_id,user_id) DO UPDATE SET status=EXCLUDED.status,joined_at=NOW()`,
            [booking.event_id, booking.user_id],
          );
          return { ok: true, eventId: booking.event_id };
        });
        if (!confirmation.ok) {
          return { success: false, bookingId: payment.booking_id, message: confirmation.message! };
        }
      }

      this.logger.log(`Payment verified: ref=${refId} booking=${payment.booking_id}`);
      return { success: true, refId, bookingId: payment.booking_id, kind: 'booking', message: `پرداخت موفق — کد پیگیری: ${refId}` };
    }

    await this.ds.query(
      `UPDATE payments SET status='failed', updated_at=NOW() WHERE authority=$1`,
      [authority]
    );
    return { success: false, message: `خطای تایید: کد ${code}` };
  }

  private postJson(url: string, body: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error('Invalid JSON from Zarinpal')); }
        });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('Zarinpal timeout')); });
      req.write(body);
      req.end();
    });
  }
}
