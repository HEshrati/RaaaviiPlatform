import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Event } from '../events/entities/event.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentService } from '../payment/payment.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    @InjectRepository(Event)   private eventRepository: Repository<Event>,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @InjectDataSource()        private dataSource: DataSource,
    private paymentService: PaymentService,
    private walletService: WalletService,
  ) {}

  async create(userId: string, createBookingDto: CreateBookingDto) {
    const { eventId, quantity = 1, plusOneUserId, notes, paymentMethod = 'zarinpal' } = createBookingDto;
    if (!Number.isInteger(quantity) || quantity !== 1) {
      throw new BadRequestException('هر رزرو فقط برای یک نفر اصلی و حداکثر یک همراه است');
    }
    const totalSlots = quantity + (plusOneUserId ? 1 : 0);
    if (plusOneUserId) {
      const candidate = await this.dataSource.query(
        `SELECT id, is_test_taken FROM users WHERE id = $1 LIMIT 1`,
        [plusOneUserId],
      );
      if (!candidate[0] || candidate[0].id === userId || !candidate[0].is_test_taken) {
        throw new BadRequestException('همراه باید کاربر دیگری با آزمون پایهٔ تکمیل‌شده باشد');
      }
    }

    const bookingCode = 'RAV-' + Date.now().toString(36).toUpperCase() +
      randomBytes(3).toString('hex').toUpperCase();
    let event: Event;
    let savedBooking: any;

    // رزروهای در انتظار پرداخت هم تا پایان مهلت پرداخت جایگاه را نگه می‌دارند.
    // قفل ردیف رویداد، دو رزرو هم‌زمان را از عبور از ظرفیت بازمی‌دارد.
    await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(`SELECT * FROM events WHERE id = $1 FOR UPDATE`, [eventId]);
      event = rows[0] as Event;
      if (!event || !event.is_active) throw new NotFoundException('رویداد یافت نشد');

      const participantIds = [userId, ...(plusOneUserId ? [plusOneUserId] : [])];
      const participantRows = await manager.query(
        `SELECT id,is_banned,is_test_taken FROM users WHERE id=ANY($1::uuid[])`,
        [participantIds],
      );
      const requester = participantRows.find((item: any) => item.id === userId);
      if (!requester) throw new NotFoundException('کاربر یافت نشد');
      if (requester.is_banned) {
        throw new BadRequestException('حساب کاربری شما به دلیل غیبت غیرمجاز مسدود شده است');
      }
      if (plusOneUserId) {
        const companion = participantRows.find((item: any) => item.id === plusOneUserId);
        if (!companion?.is_test_taken || companion.is_banned) {
          throw new BadRequestException('همراه انتخاب‌شده شرایط شرکت در رویداد را ندارد');
        }
      }

      await manager.query(
        `UPDATE bookings SET status='expired',updated_at=NOW()
         WHERE event_id=$1 AND status='pending' AND payment_status='unpaid'
           AND COALESCE(locked_until,created_at + INTERVAL '20 minutes') < NOW()`,
        [eventId],
      );
      const pendingRows = await manager.query(
        `SELECT COALESCE(SUM(
          COALESCE((metadata->>'quantity')::integer, 1) +
          CASE WHEN metadata->>'plusOneUserId' IS NOT NULL THEN 1 ELSE 0 END
        ), 0) AS reserved_slots
         FROM bookings
         WHERE event_id = $1 AND status = 'pending' AND locked_until > NOW()`,
        [eventId],
      );
      const reservedSlots = Number(pendingRows[0]?.reserved_slots || 0);
      if (Number(event.current_bookings || 0) + reservedSlots + totalSlots > Number(event.capacity)) {
        throw new BadRequestException('ظرفیت رویداد تکمیل شده است');
      }

      const existing = await manager.query(
        `SELECT id FROM bookings
         WHERE event_id=$1 AND status NOT IN ('cancelled','expired')
           AND (
             user_id=ANY($2::uuid[])
             OR metadata->>'plusOneUserId'=ANY($3::text[])
           )
         LIMIT 1`,
        [eventId, participantIds, participantIds],
      );
      if (existing.length) {
        throw new BadRequestException('شما یا همراه انتخاب‌شده قبلاً در این رویداد رزرو دارید');
      }

      const booking = manager.create(Booking, {
        user_id: userId,
        event_id: eventId,
        status: 'pending',
        payment_status: 'unpaid',
        matching_status: 'matching_pending',
        booking_code: bookingCode,
        amount_paid: Number(event.price) * totalSlots,
        locked_until: new Date(Date.now() + 20 * 60_000),
        metadata: { notes, plusOneUserId, quantity },
      } as any);
      savedBooking = await manager.save(booking as any);
    });

    // رزرو رایگان
    if (!event.price || event.price <= 0) {
      await this.dataSource.transaction(async (manager) => {
        const bookingRows = await manager.query(`SELECT status FROM bookings WHERE id=$1 FOR UPDATE`, [savedBooking.id]);
        if (!bookingRows.length || bookingRows[0].status !== 'pending') {
          throw new BadRequestException('رزرو در وضعیت قابل تأیید نیست');
        }
        const eventRows = await manager.query(`SELECT current_bookings,capacity FROM events WHERE id=$1 FOR UPDATE`, [eventId]);
        if (!eventRows.length || Number(eventRows[0].current_bookings) + totalSlots > Number(eventRows[0].capacity)) {
          throw new BadRequestException('ظرفیت رویداد تکمیل شده است');
        }
        await manager.query(
          `UPDATE bookings SET status='confirmed',payment_status='free',confirmed_at=NOW(),updated_at=NOW() WHERE id=$1`,
          [savedBooking.id],
        );
        await manager.query(
          `UPDATE events SET current_bookings=current_bookings+$2,updated_at=NOW() WHERE id=$1`,
          [eventId, totalSlots],
        );
        await manager.query(
          `INSERT INTO match_queue (event_id,user_id,status,joined_at)
           VALUES ($1,$2,CASE WHEN EXISTS (SELECT 1 FROM user_rgci_profiles WHERE user_id=$2)
             THEN 'waiting' ELSE 'needs_profile_completion' END,NOW())
           ON CONFLICT (event_id,user_id) DO UPDATE SET status=EXCLUDED.status,joined_at=NOW()`,
          [eventId, userId],
        );
      });
      // log journey
      await this._logJourney(userId, 'reservation_created', 'reservation', savedBooking.id, { eventId });
      return { id: savedBooking.id, bookingCode, paymentUrl: null, isFree: true, status: 'confirmed' };
    }

    // پرداخت از کیف پول
    if (paymentMethod === 'wallet') {
      try {
        const result = await this.dataSource.transaction(async (manager) => {
          const bookingRows = await manager.query(
            `SELECT status FROM bookings WHERE id=$1 AND user_id=$2 FOR UPDATE`,
            [savedBooking.id, userId],
          );
          if (!bookingRows.length || bookingRows[0].status !== 'pending') {
            throw new BadRequestException('رزرو در وضعیت قابل پرداخت نیست');
          }
          const eventRows = await manager.query(
            `SELECT current_bookings, capacity FROM events WHERE id=$1 FOR UPDATE`, [eventId],
          );
          if (!eventRows.length || Number(eventRows[0].current_bookings) + totalSlots > Number(eventRows[0].capacity)) {
            throw new BadRequestException('ظرفیت رویداد تکمیل شده است');
          }
          const debit = await this.walletService.debitWallet(
            userId, Number(event.price) * totalSlots, 'رزرو راوی - ' + (event.title || ''),
            savedBooking.id, manager,
          );
          await manager.query(
            `UPDATE bookings SET status='confirmed', payment_status='paid', payment_type='wallet',
               wallet_deducted=true, payment_id=$2, confirmed_at=NOW(), updated_at=NOW()
             WHERE id=$1`,
            [savedBooking.id, debit.paymentId],
          );
          await manager.query(
            `UPDATE events SET current_bookings=current_bookings+$2, updated_at=NOW() WHERE id=$1`,
            [eventId, totalSlots],
          );
          await manager.query(
            `INSERT INTO match_queue (event_id,user_id,status,joined_at)
             VALUES ($1,$2,CASE WHEN EXISTS (SELECT 1 FROM user_rgci_profiles WHERE user_id=$2)
               THEN 'waiting' ELSE 'needs_profile_completion' END,NOW())
             ON CONFLICT (event_id,user_id) DO UPDATE SET status=EXCLUDED.status, joined_at=NOW()`,
            [eventId, userId],
          );
          await manager.query(
            `INSERT INTO user_journey_events (user_id,event_name,journey_type,entity_type,entity_id,payload)
             VALUES ($1,'reservation_created','reservation','reservation',$2,$3)`,
            [userId, savedBooking.id, JSON.stringify({ eventId, paymentMethod: 'wallet' })],
          ).catch(() => {});
          return debit;
        });
        return {
          id: savedBooking.id, bookingCode: savedBooking.booking_code, paymentUrl: null,
          status: 'confirmed', newBalance: result.newBalance,
        };
      } catch (err: any) {
        // پرداخت ناموفق - رزرو pending باقی می‌ماند تا کاربر روش دیگری انتخاب کند
        return {
          id: savedBooking.id,
          bookingCode: savedBooking.booking_code,
          paymentUrl: null,
          error: err.message || 'خطا در پرداخت از کیف پول',
        };
      }
    }

    try {
      const paymentResult = await this.paymentService.requestPayment({
        userId,
        bookingId: savedBooking.id,
        amount: event.price * totalSlots,
        description: 'رزرو راوی - ' + (event.title || ''),
      });
      await this._logJourney(userId, 'reservation_created', 'reservation', savedBooking.id, { eventId });
      return {
        id: savedBooking.id,
        bookingCode: savedBooking.booking_code,
        paymentUrl: paymentResult.paymentUrl,
        authority: paymentResult.authority,
      };
    } catch (err: any) {
      return {
        id: savedBooking.id,
        bookingCode: savedBooking.booking_code,
        paymentUrl: null,
        error: err.message || 'خطا در اتصال به درگاه پرداخت',
      };
    }
  }

  // بعد از تایید پرداخت — این متد از payment service صدا زده می‌شه
  async confirmPayment(bookingId: string) {
    await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(`SELECT * FROM bookings WHERE id=$1 FOR UPDATE`, [bookingId]);
      const booking = rows[0];
      if (!booking || booking.status === 'confirmed') return;
      if (booking.status !== 'pending') throw new BadRequestException('رزرو در وضعیت قابل تأیید نیست');
      const metadata = booking.metadata || {};
      const quantity = Number(metadata.quantity || 1);
      const slots = (Number.isInteger(quantity) && quantity > 0 ? quantity : 1) + (metadata.plusOneUserId ? 1 : 0);
      const eventRows = await manager.query(`SELECT current_bookings,capacity FROM events WHERE id=$1 FOR UPDATE`, [booking.event_id]);
      if (!eventRows.length || Number(eventRows[0].current_bookings) + slots > Number(eventRows[0].capacity)) {
        throw new BadRequestException('ظرفیت رویداد تکمیل شده است');
      }
      await manager.query(
        `UPDATE bookings SET status='confirmed',payment_status='paid',matching_status='matching_pending',confirmed_at=NOW(),updated_at=NOW() WHERE id=$1`,
        [bookingId],
      );
      await manager.query(`UPDATE events SET current_bookings=current_bookings+$2,updated_at=NOW() WHERE id=$1`, [booking.event_id, slots]);
      await manager.query(
        `INSERT INTO match_queue (event_id,user_id,status,joined_at)
         VALUES ($1,$2,CASE WHEN EXISTS (SELECT 1 FROM user_rgci_profiles WHERE user_id=$2)
           THEN 'waiting' ELSE 'needs_profile_completion' END,NOW())
         ON CONFLICT (event_id,user_id) DO UPDATE SET status=EXCLUDED.status,joined_at=NOW()`,
        [booking.event_id, booking.user_id],
      );
    });
  }

  async findAll(userId: string) {
    return this.bookingRepository.find({
      where: { user_id: userId },
      relations: { event: true },
      order: { created_at: 'DESC' },
      take: 200,
    });
  }

  /**
   * فهرست‌کردن کاربران دیگر، بدون رابطهٔ از پیش‌ثبت‌شده، نشت حریم خصوصی است.
   * همراه فقط با شماره‌ای که مالک آن رضایت داده/وارد کرده تأیید می‌شود.
   */
  async getPlusOneCandidates(_userId: string, _eventId?: string) {
    return { users: [] };
  }

  async validatePlusOne(requesterId: string, phone: string) {
    const normalized = String(phone || '').replace(/\D/g, '');
    if (!/^09\d{9}$/.test(normalized)) {
      throw new BadRequestException('شماره همراه معتبر نیست');
    }

    const rows = await this.dataSource.query(
      `SELECT id, is_test_taken FROM users WHERE phone_number = $1 LIMIT 1`,
      [normalized],
    );
    const candidate = rows[0];
    if (!candidate || candidate.id === requesterId || !candidate.is_test_taken) {
      // پیام یکسان، از افشای وجود حساب یا وضعیت آزمون جلوگیری می‌کند.
      throw new BadRequestException('همراه باید کاربر دیگری با آزمون پایهٔ تکمیل‌شده باشد');
    }
    return { userId: candidate.id };
  }

  async findByUserId(userId: string, filters?: { status?: string }) {
    const where: any = { user_id: userId };
    if (filters?.status) where.status = filters.status;
    return this.bookingRepository.find({ where, order: { created_at: 'DESC' }, take: 200 });
  }

  private static readonly UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async findOne(id: string, userId: string) {
    if (!BookingsService.UUID_RE.test(id)) throw new NotFoundException('رزرو یافت نشد');
    const booking = await this.bookingRepository.findOne({ where: { id, user_id: userId } });
    if (!booking) throw new NotFoundException('رزرو یافت نشد');
    return booking;
  }

  // رویدادهای من با وضعیت کامل
  async getMyEvents(userId: string) {
    const rows = await this.dataSource.query(
      `SELECT
         b.id AS booking_id, b.status, b.matching_status, b.group_id,
         b.payment_status, b.created_at, b.confirmed_at,
         b.attended, b.attendance_marked_at,
         e.id AS event_id, e.title, e.start_date, e.end_date,
         e.city, e.is_online, e.location, e.cover_image, e.image_url, e.type, e.event_type
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE b.user_id = $1
       ORDER BY e.start_date DESC`,
      [userId],
    );

    const now = new Date();
    const upcoming   = rows.filter((r: any) => new Date(r.start_date) > now && r.status !== 'cancelled');
    const past       = rows.filter((r: any) => new Date(r.start_date) <= now && r.status !== 'cancelled');
    const pending    = rows.filter((r: any) => r.status === 'pending');
    const cancelled  = rows.filter((r: any) => r.status === 'cancelled');

    const withParticipation = (items: any[]) => items.map((item: any) => ({
      ...item,
      participation_status: !item.attendance_marked_at
        ? 'not_marked' : item.attended ? 'attended' : 'absent',
    }));
    return {
      upcoming: withParticipation(upcoming), past: withParticipation(past),
      pending: withParticipation(pending), cancelled: withParticipation(cancelled),
    };
  }

  async cancel(id: string, userId: string, reason?: string) {
    await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(
        `SELECT * FROM bookings WHERE id=$1 AND user_id=$2 FOR UPDATE`, [id, userId],
      );
      const booking = rows[0];
      if (!booking) throw new NotFoundException('رزرو یافت نشد');
      if (booking.status === 'cancelled') throw new BadRequestException('این رزرو قبلاً لغو شده است');
      const metadata = typeof booking.metadata === 'string' ? JSON.parse(booking.metadata || '{}') : (booking.metadata || {});
      const storedQuantity = Number(metadata.quantity || 1);
      const occupiedSlots = (Number.isInteger(storedQuantity) && storedQuantity > 0 ? storedQuantity : 1)
        + (metadata.plusOneUserId ? 1 : 0);
      const wasCapacityCounted = ['confirmed', 'matched', 'completed', 'no_show'].includes(booking.status);

      await manager.query(
        `UPDATE bookings SET status='cancelled',cancellation_reason=$2,cancelled_at=NOW(),
           group_id=NULL,matching_status='cancelled',updated_at=NOW() WHERE id=$1`,
        [id, reason || null],
      );
      await manager.query(`UPDATE match_queue SET status='cancelled' WHERE event_id=$1 AND user_id=$2`, [booking.event_id, userId]);
      if (wasCapacityCounted) {
        await manager.query(`SELECT id FROM events WHERE id=$1 FOR UPDATE`, [booking.event_id]);
        await manager.query(
          `UPDATE events SET current_bookings=GREATEST(0,current_bookings-$2),updated_at=NOW() WHERE id=$1`,
          [booking.event_id, occupiedSlots],
        );
      }

      const membershipResult = await manager.query(
        `DELETE FROM group_members WHERE event_id=$1 AND user_id=$2 RETURNING group_id`,
        [booking.event_id, userId],
      );
      const memberships = Array.isArray(membershipResult?.[0]) && typeof membershipResult?.[1] === 'number'
        ? membershipResult[0] : membershipResult;
      for (const membership of memberships) {
        const remaining = await manager.query(`SELECT user_id FROM group_members WHERE group_id=$1`, [membership.group_id]);
        if (remaining.length >= 4) {
          await manager.query(`UPDATE groups SET size=$2 WHERE id=$1`, [membership.group_id, remaining.length]);
        } else {
          const remainingIds = remaining.map((item: any) => item.user_id);
          if (remainingIds.length) {
            await manager.query(
              `UPDATE bookings SET group_id=NULL,matching_status='matching_pending',updated_at=NOW()
               WHERE event_id=$1 AND user_id=ANY($2) AND status IN ('confirmed','matched')`,
              [booking.event_id, remainingIds],
            );
            await manager.query(
              `UPDATE match_queue SET status='waiting',matched_at=NULL
               WHERE event_id=$1 AND user_id=ANY($2)`,
              [booking.event_id, remainingIds],
            );
          }
          await manager.query(`DELETE FROM groups WHERE id=$1`, [membership.group_id]);
        }
      }
    });
    await this._logJourney(userId, 'reservation_cancelled', 'reservation', id, { reason });
    return this.bookingRepository.findOne({ where: { id, user_id: userId } });
  }

  async cancelBooking(id: string, userId: string, reason?: string) {
    return this.cancel(id, userId, reason);
  }

  async updateStatus(id: string, status: string) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('رزرو یافت نشد');
    booking.status = status;
    return this.bookingRepository.save(booking);
  }

  // ── private helpers ──────────────────────────────────────────

  private async _addToMatchQueue(eventId: string, userId: string) {
    await this.dataSource.query(
      `INSERT INTO match_queue (event_id, user_id, status, joined_at)
       VALUES ($1, $2, CASE WHEN EXISTS (SELECT 1 FROM user_rgci_profiles WHERE user_id=$2)
         THEN 'waiting' ELSE 'needs_profile_completion' END, NOW())
       ON CONFLICT (event_id, user_id) DO UPDATE SET status=EXCLUDED.status, joined_at=NOW()`,
      [eventId, userId],
    ).catch(() => {});
  }

  private async _logJourney(
    userId: string, eventName: string,
    entityType: string, entityId: string, payload: any,
  ) {
    await this.dataSource.query(
      `INSERT INTO user_journey_events (user_id, event_name, journey_type, entity_type, entity_id, payload)
       VALUES ($1, $2, 'reservation', $3, $4, $5)`,
      [userId, eventName, entityType, entityId, JSON.stringify(payload)],
    ).catch(() => {});
  }
}
