/**
 * سرویس ادغام ایونت‌ها — لایه ۴ اتوماسیون
 * هر ۳۰ دقیقه بررسی می‌کند؛ ایونت‌هایی که ۱۲ ساعت دیگر شروع
 * می‌شوند و ظرفیت کافی ندارند با هم ادغام می‌شوند.
 */
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Event }   from './entities/event.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User }    from '../users/entities/user.entity';
import { SmsService } from '../sms/sms.service';

export interface MergeDetail {
  sourceEventId: string; targetEventId: string;
  movedUsers: number; reason: string;
}

@Injectable()
export class EventMergeService {
  private readonly logger = new Logger(EventMergeService.name);

  constructor(
    @InjectRepository(Event)   private eventRepo:   Repository<Event>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(User)    private userRepo:    Repository<User>,
    private readonly sms: SmsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Cron('*/30 * * * *')
  async scheduledMerge() {
    this.logger.log('⏰ بررسی ادغام ایونت‌ها...');
    try {
      const r = await this.mergeUpcomingEvents();
      if (r.mergedCount > 0) this.logger.log(`✅ ${r.mergedCount} ادغام انجام شد`);
    } catch (e) { this.logger.error('❌ خطا:', e); }
  }

  async mergeUpcomingEvents(): Promise<{ mergedCount: number; details: MergeDetail[] }> {
    const now = new Date();
    const t12 = new Date(now.getTime() + 12 * 3600_000);
    const t13 = new Date(now.getTime() + 13 * 3600_000);

    const events = await this.eventRepo.find({
      where: { start_date: Between(t12, t13), is_active: true },
      order: { start_date: 'ASC' },
    });
    if (events.length < 2) return { mergedCount: 0, details: [] };

    const groups = this.groupByCategoryCity(events);
    const details: MergeDetail[] = [];

    for (const evts of Object.values(groups)) {
      if (evts.length < 2) continue;
      details.push(...await this.mergeGroup(evts));
    }
    return { mergedCount: details.length, details };
  }

  private groupByCategoryCity(events: Event[]): Record<string, Event[]> {
    return events.reduce((acc, e) => {
      const k = `${e.event_type||'g'}_${e.city||'x'}`;
      (acc[k] = acc[k] || []).push(e);
      return acc;
    }, {} as Record<string, Event[]>);
  }

  private async mergeGroup(events: Event[]): Promise<MergeDetail[]> {
    events.sort((a, b) => b.current_bookings - a.current_bookings);
    const details: MergeDetail[] = [];

    for (const src of events.filter(e => e.current_bookings < Math.ceil(e.capacity * 0.5))) {
      const tgt = events.find(e =>
        e.id !== src.id &&
        !(e as any).merged_into &&
        e.current_bookings + src.current_bookings <= e.capacity,
      );
      if (!tgt) continue;

      try {
        const detail = await this.mergePair(src.id, tgt.id, false);
        details.push(detail);
        src.current_bookings = 0;
        (src as any).merged_into = tgt.id;
        tgt.current_bookings += detail.movedUsers;
        this.logger.log(`✅ ادغام: ${detail.movedUsers} نفر → "${tgt.title}"`);
      } catch (error: any) {
        this.logger.warn(`ادغام ${src.id} در ${tgt.id} انجام نشد: ${error?.message || error}`);
      }
    }
    return details;
  }

  async manualMerge(sourceEventId: string, targetEventId: string): Promise<MergeDetail> {
    return this.mergePair(sourceEventId, targetEventId, true);
  }

  private async mergePair(sourceEventId: string, targetEventId: string, manual: boolean): Promise<MergeDetail> {
    if (!sourceEventId || !targetEventId || sourceEventId === targetEventId) {
      throw new BadRequestException('دو رویداد متفاوت انتخاب کنید');
    }

    const merged = await this.dataSource.transaction(async (manager) => {
      const events = await manager.query(
        `SELECT * FROM events WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE`,
        [[sourceEventId, targetEventId]],
      );
      const src = events.find((event: any) => event.id === sourceEventId);
      const tgt = events.find((event: any) => event.id === targetEventId);
      if (!src || !tgt) throw new NotFoundException('رویداد یافت نشد');
      if (!src.is_active || src.merged_into) throw new BadRequestException('رویداد مبدا قبلاً غیرفعال یا ادغام شده است');
      if (!tgt.is_active || tgt.merged_into) throw new BadRequestException('رویداد مقصد فعال نیست');

      const bookings = await manager.query(
        `SELECT b.id,b.user_id,b.metadata,u.phone_number
         FROM bookings b JOIN users u ON u.id=b.user_id
         WHERE b.event_id=$1 AND b.status IN ('confirmed','matched','completed','no_show')
         ORDER BY b.created_at`,
        [sourceEventId],
      );
      const userIds = bookings.map((booking: any) => booking.user_id);
      if (userIds.length) {
        const overlap = await manager.query(
          `SELECT 1 FROM bookings WHERE event_id=$1 AND user_id=ANY($2::uuid[])
           AND status NOT IN ('cancelled','expired') LIMIT 1`,
          [targetEventId, userIds],
        );
        if (overlap.length) {
          throw new BadRequestException('حداقل یک کاربر در هر دو رویداد رزرو فعال دارد');
        }
      }

      const movedSlots = bookings.reduce((sum: number, booking: any) => {
        const metadata = typeof booking.metadata === 'string'
          ? JSON.parse(booking.metadata || '{}') : (booking.metadata || {});
        const quantity = Number(metadata.quantity || 1);
        return sum + (Number.isInteger(quantity) && quantity > 0 ? quantity : 1)
          + (metadata.plusOneUserId ? 1 : 0);
      }, 0);
      if (Number(tgt.current_bookings) + movedSlots > Number(tgt.capacity)) {
        throw new BadRequestException('ظرفیت رویداد مقصد کافی نیست');
      }

      if (bookings.length) {
        const bookingIds = bookings.map((booking: any) => booking.id);
        await manager.query(
          `UPDATE bookings SET event_id=$1,group_id=NULL,matching_status='matching_pending',
             metadata=COALESCE(metadata,'{}'::jsonb) || $2::jsonb,updated_at=NOW()
           WHERE id=ANY($3::uuid[])`,
          [targetEventId, JSON.stringify({ merged_from: sourceEventId, merged_at: new Date().toISOString(), manual }), bookingIds],
        );
        await manager.query(`DELETE FROM match_queue WHERE event_id=$1 AND user_id=ANY($2::uuid[])`, [sourceEventId, userIds]);
        await manager.query(
          `INSERT INTO match_queue(event_id,user_id,status,joined_at)
           SELECT $1,u.id,CASE WHEN EXISTS(SELECT 1 FROM user_rgci_profiles r WHERE r.user_id=u.id)
             THEN 'waiting' ELSE 'needs_profile_completion' END,NOW()
           FROM users u WHERE u.id=ANY($2::uuid[])
           ON CONFLICT(event_id,user_id) DO UPDATE SET status=EXCLUDED.status,joined_at=NOW()`,
          [targetEventId, userIds],
        );
      }

      await manager.query(`DELETE FROM group_members WHERE event_id=$1`, [sourceEventId]);
      await manager.query(`UPDATE groups SET status='merged',updated_at=NOW() WHERE event_id=$1`, [sourceEventId]);
      await manager.query(
        `UPDATE events SET current_bookings=current_bookings+$1,updated_at=NOW() WHERE id=$2`,
        [movedSlots, targetEventId],
      );
      await manager.query(
        `UPDATE events SET current_bookings=0,is_active=false,merged_into=$1,merged_at=NOW(),updated_at=NOW() WHERE id=$2`,
        [targetEventId, sourceEventId],
      );

      return { src, tgt, bookings, movedSlots };
    });

    const siteUrl = `${process.env.FRONTEND_URL || 'https://raaviiplatform.com'}/events/${targetEventId}`;
    const mergeDate = new Date(merged.tgt.start_date).toLocaleDateString('fa-IR');
    const mergeTime = new Date(merged.tgt.start_date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    await Promise.allSettled(merged.bookings
      .filter((booking: any) => booking.phone_number)
      .map((booking: any) => this.sms.sendMergeNotification(
        booking.phone_number, merged.tgt.title, mergeDate, mergeTime, siteUrl,
      )));

    return {
      sourceEventId,
      targetEventId,
      movedUsers: merged.movedSlots,
      reason: manual ? 'ادغام دستی ادمین' : `ادغام رویداد کم‌ظرفیت (${merged.src.current_bookings}/${merged.src.capacity})`,
    };
  }
}
