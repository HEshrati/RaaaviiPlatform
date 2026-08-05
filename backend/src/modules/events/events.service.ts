import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../../database/entities/user.entity';
import { SmsReminderService } from './sms-reminder.service';
import { uploadDirectory } from '../../common/files/upload-path';

const CATEGORY_ALIASES: Record<string, string[]> = {
  entertainment: ['entertainment', 'hambazi', 'musiki', 'varzesh', 'cinema'],
  psychology: ['psychology', 'rashd-fardi', 'rashdfardi', 'meditation', 'group-support', 'groupsupport', 'group-therapy', 'therapist', 'tarapist', 'hamravan', 'hamzist'],
  culture: ['culture', 'naghashi', 'ketab', 'akasi', 'theatre'],
};

const CATEGORY_VARIANTS: Record<string, string[]> = {
  'rashd-fardi': ['rashd-fardi', 'rashdfardi', 'رشد فردی', 'توسعه فردی'],
  'group-support': ['group-support', 'groupsupport'],
  'group-therapy': ['group-therapy', 'grouptherapy', 'therapist', 'tarapist'],
};

function normalizeCategory(value?: string | null): string {
  const key = String(value || '').trim().toLowerCase().replace(/_/g, '-');
  const aliases: Record<string, string> = {
    rashdfardi: 'rashd-fardi', 'رشد فردی': 'rashd-fardi', 'توسعه فردی': 'rashd-fardi', groupsupport: 'group-support',
    tarapist: 'group-therapy', therapist: 'group-therapy', grouptherapy: 'group-therapy',
  };
  return aliases[key] || key;
}

// ─── تایپ پروفایل شخصیتی ──────────────────────────────────────────────────
export interface PersonalityProfile {
  introExtro: number;    // 1-5: درون‌گرا → برون‌گرا
  motivation: number;    // 1-5: نیاز به جرقه → خودانگیخته
  career: number;        // 1-5: نارضایتی → رضایت شغلی
  decision: string;      // 'فکر' | 'احساس'
  vibe: string;          // 'آرام' | 'پرهیجان'
  travel: string;        // 'برنامه‌ریزی' | 'ماجراجویی'
  location: string;      // 'شهر' | 'طبیعت' | 'هر جا'
  relationship: string;  // 'مجرد' | 'متأهل' | 'در رابطه' | 'پیچیده'
  city: string;
  gender: string;
}

// ─── الگوریتم امتیاز مچینگ ─────────────────────────────────────────────────
export function calcMatchScore(
  userProfile: PersonalityProfile,
  event: Event,
): number {
  let score = 50; // بیس امتیاز

  // ۱. شهر مطابقت دارد؟
  if (event.city && userProfile.city) {
    if (event.city === userProfile.city) score += 30;
    else score -= 20;
  }

  // ۲. نوع رویداد با شخصیت تطابق دارد؟
  const type = (event.event_type || event.category || '').toLowerCase();

  if (type.includes('hampa') || type.includes('outdoor') || type.includes('هم‌پا')) {
    if (userProfile.location === 'منظره‌ی کوه و جنگل و صدای باد') score += 15;
    if (userProfile.introExtro >= 4) score += 5;
  }
  if (type.includes('hamneshin') || type.includes('hamghesse') || type.includes('همنشین')) {
    if (userProfile.introExtro <= 2) score += 10;
    if (userProfile.vibe === 'یه کافه‌ی آروم و دنج با میزهای همیشگی') score += 10;
  }
  if (type.includes('hambazi') || type.includes('hamteymi') || type.includes('هم‌بازی')) {
    if (userProfile.introExtro >= 4) score += 10;
    if (userProfile.motivation >= 4) score += 5;
  }
  if (type.includes('hamsohbat') || type.includes('hamfekr') || type.includes('هم‌صحبت')) {
    if (userProfile.decision === 'بیشتر با فکر و تحلیل جلو میرم') score += 10;
    if (userProfile.introExtro >= 3) score += 5;
  }
  if (type.includes('hamamooz') || type.includes('hamkar') || type.includes('هم‌آموز')) {
    if (userProfile.motivation >= 4) score += 10;
    if (userProfile.career <= 2) score += 8; // دنبال رشده
  }

  // ۳. انرژی رویداد
  const energyHigh = ['hambazi', 'hamteymi', 'هم‌بازی', 'هم‌تیمی'];
  const energyLow  = ['hamneshin', 'hamsohbat', 'همنشین', 'هم‌صحبت'];
  if (energyHigh.some(t => type.includes(t)) && userProfile.introExtro >= 4) score += 5;
  if (energyLow.some(t => type.includes(t)) && userProfile.introExtro <= 2) score += 5;

  // ۴. ظرفیت خالی بونوس
  if (event.capacity - event.current_bookings > 3) score += 5;

  return Math.max(0, Math.min(100, score));
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectDataSource()
    private dataSource: DataSource,
    private readonly smsReminderService: SmsReminderService,
  ) {}

  private prepareCreateData(createEventDto: CreateEventDto & Record<string, any>) {
    // Handle camelCase → snake_case field mapping
    const dto: any = { ...createEventDto };
    if (dto.startDate && !dto.start_date) dto.start_date = new Date(dto.startDate);
    if (dto.endDate && !dto.end_date) dto.end_date = new Date(dto.endDate);
    if (!dto.start_date && dto.startDate) dto.start_date = new Date(dto.startDate);
    if (!dto.end_date) dto.end_date = dto.start_date ? new Date(new Date(dto.start_date).getTime() + 2 * 60 * 60 * 1000) : new Date();
    if (!dto.event_type) dto.event_type = dto.category || 'hamneshin';
    if (dto.category) dto.category = normalizeCategory(dto.category);
    if (!dto.price) dto.price = 0;
    // camelCase → snake_case برای is_active
    if (dto.isActive !== undefined && dto.is_active === undefined) dto.is_active = dto.isActive;
    // اطمینان از فعال بودن پیش‌فرض
    if (dto.is_active === undefined) dto.is_active = true;
    dto.submitted_at = dto.submitted_at || new Date();
    return dto;
  }

  async create(createEventDto: CreateEventDto & {
    created_by?: string;
    submitted_by_role?: string;
    approval_status?: string;
    reviewed_by?: string;
    reviewed_at?: Date;
  }): Promise<Event> {
    const dto = this.prepareCreateData(createEventDto);
    const event = this.eventsRepository.create(dto);
    const savedEvent = await this.eventsRepository.save(event) as any as Event;

    // 🔄 تولید خودکار عکس توسط هوش مصنوعی در پس‌زمینه (بدون بلاک کردن پاسخ)
    if (!dto.image_url) {
      this.generateAndSaveEventImage(savedEvent).catch(err =>
        console.error('[AI Image] Background generation failed:', err.message)
      );
    }

    return savedEvent;
  }

  async assertApprovedFacilitator(userId: string): Promise<void> {
    const rows = await this.dataSource.query(
      `SELECT fp.status, u.role
       FROM facilitator_profiles fp
       JOIN users u ON u.id=fp.user_id
       WHERE fp.user_id=$1 LIMIT 1`,
      [userId],
    );
    if (!rows.length || rows[0].status !== 'approved' || rows[0].role !== 'facilitator') {
      throw new ForbiddenException('فقط تسهیلگر تأییدشده می‌تواند رویداد پیشنهاد دهد');
    }
  }

  async createFacilitatorRequest(createEventDto: CreateEventDto, userId: string): Promise<Event> {
    await this.assertApprovedFacilitator(userId);
    const dto = this.prepareCreateData({
      ...createEventDto,
      created_by: userId,
      submitted_by_role: 'facilitator',
      approval_status: 'pending_review',
      is_active: false,
      reviewed_by: null,
      reviewed_at: null,
      review_note: null,
    });
    if (new Date(dto.start_date).getTime() <= Date.now()) {
      throw new BadRequestException('زمان رویداد باید در آینده باشد');
    }

    const savedEvent = await this.dataSource.transaction(async (manager) => {
      const event = manager.create(Event, dto);
      const saved = await manager.save(Event, event);
      await manager.query(
        `INSERT INTO event_hosts(event_id,host_id,role,name,bio_snapshot)
         SELECT $1,$2,'facilitator',
                CONCAT_WS(' ',fp.first_name,fp.last_name),fp.bio
         FROM facilitator_profiles fp WHERE fp.user_id=$2
         ON CONFLICT DO NOTHING`,
        [saved.id, userId],
      );
      return saved;
    });

    if (!dto.image_url) {
      this.generateAndSaveEventImage(savedEvent).catch(err =>
        console.error('[AI Image] Background generation failed:', err.message)
      );
    }
    return savedEvent;
  }

  async getFacilitatorEvents(userId: string) {
    await this.assertApprovedFacilitator(userId);
    const events = await this.eventsRepository.createQueryBuilder('event')
      .where('event.created_by = :userId', { userId })
      .orderBy('event.created_at', 'DESC')
      .getMany();
    return {
      events: events.map(event => ({
        ...event,
        startDate: event.start_date,
        endDate: event.end_date,
        reservedCount: event.current_bookings,
        available_slots: event.capacity - event.current_bookings,
      })),
      total: events.length,
    };
  }

  async getAllForAdmin(status?: string) {
    const qb = this.eventsRepository.createQueryBuilder('event')
      .leftJoin(User, 'creator', 'creator.id::text = event.created_by')
      .addSelect(['creator.name', 'creator.mobileNumber'])
      .orderBy('event.created_at', 'DESC');
    if (status) qb.where('event.approval_status = :status', { status });
    const { entities, raw } = await qb.getRawAndEntities();
    return {
      events: entities.map((event, index) => ({
        ...event,
        startDate: event.start_date,
        endDate: event.end_date,
        reservedCount: event.current_bookings,
        creator_name: raw[index]?.creator_name || null,
        creator_phone: raw[index]?.creator_phone_number || null,
      })),
      total: entities.length,
    };
  }

  async canManageEvent(eventId: string, userId: string, isAdmin = false): Promise<boolean> {
    if (isAdmin) return true;
    const rows = await this.dataSource.query(
      `SELECT 1
       FROM events e
       JOIN facilitator_profiles fp ON fp.user_id=$2 AND fp.status='approved'
       JOIN users u ON u.id=fp.user_id AND u.role='facilitator'
       WHERE e.id=$1
         AND e.approval_status='approved'
         AND (e.created_by=$2::text OR EXISTS (
           SELECT 1 FROM event_hosts eh WHERE eh.event_id=e.id AND eh.host_id=$2
         ))
       LIMIT 1`,
      [eventId, userId],
    );
    return rows.length > 0;
  }

  async updateByFacilitator(id: string, userId: string, data: Partial<CreateEventDto>): Promise<Event> {
    await this.assertApprovedFacilitator(userId);
    const event = await this.findOne(id);
    if (event.created_by !== userId) {
      throw new ForbiddenException('این رویداد متعلق به شما نیست');
    }
    if (!['approved', 'pending_review', 'needs_revision'].includes(event.approval_status)) {
      throw new ForbiddenException('رویداد ردشده قابل ویرایش نیست');
    }

    const allowed = [
      'title', 'description', 'event_type', 'category', 'capacity', 'price',
      'start_date', 'startDate', 'end_date', 'endDate', 'location', 'city',
      'is_online', 'image_url', 'tags', 'features',
    ];
    const safeData: any = {};
    for (const key of allowed) {
      if ((data as any)[key] !== undefined) safeData[key] = (data as any)[key];
    }
    if (safeData.capacity !== undefined && Number(safeData.capacity) < event.current_bookings) {
      throw new BadRequestException('ظرفیت نمی‌تواند کمتر از تعداد رزروهای فعلی باشد');
    }
    if (event.current_bookings > 0 && safeData.price !== undefined && Number(safeData.price) !== Number(event.price)) {
      throw new BadRequestException('پس از ثبت اولین رزرو، مبلغ قابل تغییر نیست');
    }
    if (safeData.startDate && !safeData.start_date) safeData.start_date = safeData.startDate;
    if (safeData.endDate && !safeData.end_date) safeData.end_date = safeData.endDate;
    delete safeData.startDate;
    delete safeData.endDate;
    if (safeData.start_date && new Date(safeData.start_date).getTime() <= Date.now()) {
      throw new BadRequestException('زمان رویداد باید در آینده باشد');
    }

    // اصلاح رویداد در وضعیت needs_revision دوباره آن را برای ادمین ارسال می‌کند.
    if (event.approval_status === 'needs_revision') {
      safeData.approval_status = 'pending_review';
      safeData.review_note = null;
      safeData.reviewed_at = null;
      safeData.reviewed_by = null;
      safeData.is_active = false;
      safeData.submitted_at = new Date();
    }
    return this.update(id, safeData);
  }

  async reviewFacilitatorEvent(
    id: string,
    adminId: string,
    action: 'approve' | 'reject' | 'request-revision',
    note?: string,
  ): Promise<Event> {
    if (!['approve', 'reject', 'request-revision'].includes(action)) {
      throw new BadRequestException('عملیات بررسی معتبر نیست');
    }
    if (action !== 'approve' && !String(note || '').trim()) {
      throw new BadRequestException('دلیل رد یا درخواست اصلاح الزامی است');
    }
    return this.dataSource.transaction(async manager => {
      const event = await manager.findOne(Event, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!event) throw new NotFoundException('رویداد یافت نشد');
      if (event.submitted_by_role !== 'facilitator') {
        throw new BadRequestException('این رویداد درخواست تسهیلگر نیست');
      }
      if (!['pending_review', 'needs_revision'].includes(event.approval_status)) {
        throw new BadRequestException('این درخواست قبلاً بررسی شده است');
      }
      if (action === 'approve' && new Date(event.start_date).getTime() <= Date.now()) {
        throw new BadRequestException('رویداد گذشته قابل تأیید نیست؛ از تسهیلگر درخواست اصلاح زمان کنید');
      }
      event.approval_status = action === 'approve'
        ? 'approved'
        : action === 'reject' ? 'rejected' : 'needs_revision';
      event.is_active = action === 'approve';
      event.review_note = String(note || '').trim() || null;
      event.reviewed_by = adminId;
      event.reviewed_at = new Date();
      const saved = await manager.save(Event, event);
      if (action === 'approve') {
        await manager.query(
          `INSERT INTO event_hosts(event_id,host_id,role)
           VALUES($1,$2,'facilitator') ON CONFLICT DO NOTHING`,
          [event.id, event.created_by],
        );
      }
      return saved;
    });
  }

  /**
   * لیست رویدادها — اگر پروفایل کاربر بده، با مچینگ مرتب می‌شه
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    city?: string;
    event_type?: string;
    category?: string;
    userId?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // اگه شهر از query نیومد، از پروفایل کاربر بگیر
    let effectiveCity = query.city || '';
    if (!effectiveCity && query.userId) {
      const prof = await this.usersRepository.manager
        .getRepository('profiles')
        .findOne({ where: { user_id: query.userId } })
        .catch(() => null) as any;
      effectiveCity = prof?.city || '';
    }

    const qb = this.eventsRepository
      .createQueryBuilder('event')
      .where('event.is_active = :isActive', { isActive: true });

    if (effectiveCity) qb.andWhere('event.city ILIKE :city', { city: `%${effectiveCity}%` });
    if (query.event_type) qb.andWhere('event.event_type = :type', { type: query.event_type });
    if (query.category) {
      const requested = normalizeCategory(query.category);
      const categoryValues = CATEGORY_ALIASES[requested] || CATEGORY_VARIANTS[requested] || [requested];
      qb.andWhere(`(
        LOWER(REPLACE(COALESCE(event.category, ''), '_', '-')) = ANY(:categoryValues)
        OR LOWER(REPLACE(COALESCE(event.event_type, ''), '_', '-')) = ANY(:categoryValues)
      )`, { categoryValues });
    }

    const [data, total] = await qb
      .orderBy('event.start_date', 'ASC')
      .skip(skip).take(limit * 3) // بیشتر بگیر تا مرتب‌سازی بهتر باشه
      .getManyAndCount();

    let events = data.map((e) => ({
      ...e,
      startDate: e.start_date,       // camelCase alias for frontend
      endDate: e.end_date,           // camelCase alias for frontend
      reservedCount: e.current_bookings,
      available_slots: e.capacity - e.current_bookings,
      matchScore: 50,
    }));

    // اگر userId داریم، با پروفایل مرتب کن
    if (query.userId) {
      try {
        const profile = await this.getUserPersonalityProfile(query.userId);
        if (profile) {
          events = events.map((e) => ({
            ...e,
            matchScore: calcMatchScore(profile, e as any),
          }));
          events.sort((a, b) => b.matchScore - a.matchScore);
        }
      } catch { /* بدون مچینگ پیش می‌ریم */ }
    }

    return {
      events: events.slice(0, limit),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * دریافت پروفایل شخصیتی کاربر از test_results
   */
  async getUserPersonalityProfile(userId: string): Promise<PersonalityProfile | null> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    // دریافت پروفایل کاربر برای شهر و جنسیت
    const profile = await this.usersRepository.manager
      .getRepository('profiles')
      .findOne({ where: { user_id: userId } })
      .catch(() => null) as any;

    const userCity   = profile?.city   || '';
    const userGender = profile?.gender || '';

    // دریافت آخرین نتیجه تست
    const result = await (this.usersRepository.manager
      .getRepository('test_results') as any)
      ?.findOne({
        where: { user_id: userId, test_name: 'personality_hamneshin_v2' },
        order: { completed_at: 'DESC' },
      }).catch(() => null);

    if (!result?.scores) {
      // حتی بدون تست، شهر و جنسیت رو برگردون
      return {
        introExtro: 3,
        motivation: 3,
        career: 3,
        decision: '',
        vibe: '',
        travel: '',
        location: '',
        relationship: '',
        city: userCity,
        gender: userGender,
      };
    }

    const s = result.scores;
    const mainResult = result.main_result ? JSON.parse(result.main_result) : {};

    return {
      introExtro: s.q4 || 3,
      motivation: s.q5 || 3,
      career: s.q6 || 3,
      decision: mainResult.decision || '',
      vibe: mainResult.vibe || '',
      travel: mainResult.travel || '',
      location: mainResult.location || '',
      relationship: mainResult.relationship || '',
      city: userCity,
      gender: userGender,
    };
  }

  /**
   * پیشنهاد گروهی بعد از اولین رزرو + بر اساس تلگرام
   */
  async getGroupRecommendations(userId: string): Promise<{
    events: any[];
    reason: string;
    groupSuggestions?: any[];
  }> {
    // بررسی دارای رزرو قبلی هست؟
    const bookings = await this.bookingsRepository.find({
      where: { user_id: userId },
    });

    const profile = await this.getUserPersonalityProfile(userId);
    const userCity = profile?.city || "";
    const allEvents = await this.findAll({ limit: 50, userId, city: userCity });

    if (bookings.length === 0) {
      // اولین بار — فقط بر اساس تست
      return {
        events: allEvents.events.slice(0, 5),
        reason: 'بر اساس پاسخ‌های تست شخصیتی',
      };
    }

    // بعد از اولین رزرو — پیشنهاد گروهی با آدم‌های مشابه
    const attendedEventIds = bookings.map((b) => b.event_id);
    const coAttendees = await this.bookingsRepository
      .createQueryBuilder('b')
      .where('b.event_id IN (:...eventIds)', { eventIds: attendedEventIds })
      .andWhere('b.user_id != :userId', { userId })
      .select(['b.user_id'])
      .distinct(true)
      .limit(20)
      .getRawMany();

    const coUserIds = coAttendees.map((c) => c.b_user_id);

    // رویدادهایی که هم‌رزروان هم ثبت‌نام کردن
    let groupEvents: any[] = [];
    if (coUserIds.length > 0) {
      const coBookings = await this.bookingsRepository
        .createQueryBuilder('b')
        .where('b.user_id IN (:...userIds)', { userIds: coUserIds })
        .andWhere('b.event_id NOT IN (:...attended)', { attended: attendedEventIds })
        .select(['b.event_id', 'COUNT(b.user_id) as count'])
        .groupBy('b.event_id')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany();

      const groupEventIds = coBookings.map((b) => b.b_event_id);
      if (groupEventIds.length > 0) {
        const gEvents = await this.eventsRepository
          .createQueryBuilder('e')
          .where('e.id IN (:...ids)', { ids: groupEventIds })
          .andWhere('e.is_active = true')
          .getMany();

        groupEvents = gEvents.map((e) => ({
          ...e,
          reservedCount: e.current_bookings,
          matchScore: profile ? calcMatchScore(profile, e) : 70,
          suggestionReason: 'افرادی که باهاشون همنشین بودی این رو دوست دارن',
        }));
      }
    }

    return {
      events: allEvents.events.slice(0, 5),
      reason: 'ترکیب شخصیت و تجربه‌های قبلی',
      groupSuggestions: groupEvents,
    };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('همنشینی یافت نشد');
    return event;
  }

  async findByCreator(creatorId: string) {
    const [events, total] = await this.eventsRepository.findAndCount({
      where: { created_by: creatorId },
      order: { created_at: 'DESC' },
    });
    return {
      events: events.map((e) => ({
        ...e,
        reservedCount: e.current_bookings,
        available_slots: e.capacity - e.current_bookings,
      })),
      total,
    };
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    const event = await this.findOne(id);
    
    // PRICE LOCK: prevent price changes after event starts
    if (data.price !== undefined && event.start_date) {
      const now = new Date();
      const startDate = new Date(event.start_date);
      if (startDate <= now) {
        delete data.price;
        console.warn(`[EVENTS] Price change blocked for event ${id} — event already started`);
      }
    }
    
    if (data.category) data.category = normalizeCategory(data.category);
    Object.assign(event, data);
    return await this.eventsRepository.save(event);
  }

  async incrementBookings(id: string): Promise<void> {
    await this.eventsRepository.increment({ id }, 'current_bookings', 1);
  }

  async decrementBookings(id: string): Promise<void> {
    await this.eventsRepository.decrement({ id }, 'current_bookings', 1);
  }

  async getLocationForUser(eventId: string, userId: string, isAdmin: boolean) {
    const event = await this.findOne(eventId);
    const now = new Date();
    const startDate = new Date(event.start_date);
    const msUntilStart = startDate.getTime() - now.getTime();
    const minutesUntilStart = Math.ceil(msUntilStart / (1000 * 60));
    const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

    if (isAdmin) {
      return { location: event.location, revealed: true, minutesRemaining: 0 };
    }

    if (hoursUntilStart > 10) {
      return { location: null, revealed: false, minutesRemaining: minutesUntilStart };
    }

    const booking = await this.bookingsRepository.findOne({
      where: { event_id: eventId, user_id: userId },
    });
    const validBooking = booking
      && ['confirmed', 'matched', 'completed'].includes(booking.status)
      && ['paid', 'free'].includes(booking.payment_status);
    if (!validBooking) {
      return { location: null, revealed: false, minutesRemaining: minutesUntilStart };
    }
    return { location: event.location, revealed: true, minutesRemaining: 0 };
  }

  async updateLocationAndNotify(eventId: string, location: string, city: string) {
    if (!String(location || '').trim()) throw new BadRequestException('مکان دقیق الزامی است');
    const event = await this.findOne(eventId);
    await this.dataSource.transaction(async (manager) => {
      await manager.update(Event, eventId, { location: location.trim(), city: String(city || '').trim() } as any);
      // تغییر مکان باید برای رزروکنندگان معتبر دوباره قابل ارسال باشد.
      await manager.query(
        `UPDATE bookings SET location_notified_at=NULL
         WHERE event_id=$1 AND status IN ('confirmed','matched','completed')`,
        [eventId],
      );
    });

    const hoursUntilStart = (new Date(event.start_date).getTime() - Date.now()) / 3_600_000;
    if (hoursUntilStart > 10) {
      return {
        success: true, notified: 0, failed: 0, scheduled: true,
        message: 'مکان ذخیره شد و از ۱۰ ساعت مانده به رویداد برای رزروکنندگان معتبر ارسال می‌شود.',
      };
    }
    const results = await this.smsReminderService.sendDueEventLocations(eventId);
    return {
      success: true,
      scheduled: false,
      message: `مکان بروزرسانی شد. ${results.sent} نفر اطلاع‌رسانی شدند.`,
      notified: results.sent,
      failed: results.failed,
    };
  }

  async getEventAttendees(eventId: string) {
    const bookings = await this.bookingsRepository.find({
      where: { event_id: eventId },
      relations: ['user'],
    });
    const users = bookings.filter((b) => b.user).map((b) => ({
      id: b.user.id,
      name: b.user.name,
      mobileNumber: b.user.mobileNumber,
      avatar: b.user.avatar,
      bookingStatus: b.status,
    }));
    return { users };
  }

  async getAdminStats(creatorId: string) {
    const events = await this.eventsRepository.find({
      where: { created_by: creatorId },
      order: { start_date: 'DESC' },
    });
    const now = new Date();
    const completed = events.filter((e) => new Date(e.end_date) < now);

    const eventStats = await Promise.all(
      completed.map(async (ev) => {
        const bookings = await this.bookingsRepository.find({ where: { event_id: ev.id } });
        const attended = bookings.filter((b) => b.attended).length;
        const reserved = bookings.length;
        const successRate = reserved > 0 ? Math.round((attended / reserved) * 100) : 0;
        return {
          eventId: ev.id,
          title: ev.title,
          capacity: ev.capacity,
          reserved,
          attended,
          successRate,
          date: new Date(ev.start_date).toLocaleDateString('fa-IR'),
        };
      }),
    );

    const avgSuccessRate =
      eventStats.length > 0
        ? Math.round(eventStats.reduce((s, e) => s + e.successRate, 0) / eventStats.length)
        : 0;

    return { events: eventStats, totalEvents: events.length, avgSuccessRate };
  }
  /**
   * ─── تولید خودکار عکس رویداد با هوش مصنوعی ────────────────────────────────
   * این متد در پس‌زمینه اجرا می‌شود و رویداد را بلاک نمی‌کند
   */
  private buildImagePrompt(event: Event): string {
    const type = (event.event_type || event.category || 'default').toLowerCase();
    const title = event.title || '';
    const city  = (event as any).city || 'تهران';

    const BASE: Record<string, string> = {
      hamneshin:  `Cozy warm cafe in ${city}, young iranian adults having friendly gathering, soft amber candlelight, shallow depth of field, cinematic, photorealistic 4k`,
      hambazi:    `Group of young iranians laughing playing board games at modern cafe in ${city}, colorful vibrant atmosphere, top-down view, photorealistic 4k`,
      hamsohbat:  `Two friends in deep intellectual conversation at a cozy bookshop cafe in ${city}, evening warm light, books on shelves, photorealistic 4k`,
      hamfekr:    `Creative brainstorming session in ${city}, young professionals with sticky notes and laptops, bright modern coworking space, photorealistic 4k`,
      hamkar:     `Professional team collaboration event in ${city}, handshake and networking, business casual, bright modern office, photorealistic 4k`,
      hamteymi:   `Energetic sports team huddle outdoors in ${city}, colorful jerseys, dynamic stadium lighting, team spirit, photorealistic 4k`,
      hampa:      `Friends hiking together on beautiful mountain trail near ${city}, golden hour sunlight, green nature, backpacks, photorealistic 4k`,
      hamamooz:   `Interactive educational workshop in ${city}, diverse young students learning together around table with laptops, photorealistic 4k`,
      hamghesse:  `Intimate storytelling circle in cozy library in ${city}, people gathered around warm candles, soft amber glow, photorealistic 4k`,
      hamziste:   `Mindfulness meditation group in peaceful garden in ${city}, soft green tones, zen atmosphere, morning light, photorealistic 4k`,
      hamrovan:   `Supportive psychology group therapy session in ${city}, circle of comfortable chairs, calm blue purple tones, safe warm space, photorealistic 4k`,
      hamhonar:   `Art workshop in colorful studio in ${city}, people painting together, creative energy, splashes of color, photorealistic 4k`,
      hamvarzesh: `Outdoor fitness group morning run in park in ${city}, energetic movement, sunrise golden light, photorealistic 4k`,
      default:    `Community social event in ${city}, diverse young iranian adults smiling and connecting, warm orange ambient light, modern venue, photorealistic 4k`,
    };

    const base = BASE[type] || BASE.default;
    const titleHint = title.length > 3 ? `, event theme: "${title}"` : '';
    return base + titleHint + ', high quality, sharp focus, no text, no watermark';
  }

  private async generateAndSaveEventImage(event: Event) {
    const AI_API_URL = process.env.AI_IMAGE_API_URL || 'https://api.gapgpt.app/v1/images/generations';
    const AI_API_KEY = process.env.AI_IMAGE_API_KEY || '';
    const AI_MODEL   = process.env.AI_IMAGE_MODEL   || 'gapgpt/z-image';

    if (!AI_API_KEY) {
      console.warn('[AI Image] AI_IMAGE_API_KEY not set. Skipping.');
      return;
    }

    const prompt = this.buildImagePrompt(event);
    console.log(`[AI Image] Generating for event ${event.id} | ${prompt.slice(0, 80)}...`);

    try {
      const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({ model: AI_MODEL, prompt, n: 1, size: '1792x1024' }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`API ${response.status}: ${err.slice(0, 200)}`);
      }

      const data: any = await response.json();
      const imageUrl = data?.data?.[0]?.url || data?.output?.[0] || data?.url;
      if (!imageUrl) throw new Error('No image URL in response: ' + JSON.stringify(data).slice(0, 200));

      console.log(`[AI Image] Downloading: ${imageUrl}`);
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) throw new Error('Failed to download image');

      const buffer = Buffer.from(await imgResponse.arrayBuffer());

      const saveDir = uploadDirectory('event-images');

      const fileName = `${event.id}.jpg`;
      const filePath = path.join(saveDir, fileName);
      fs.writeFileSync(filePath, buffer);
      console.log(`[AI Image] ✅ Saved ${buffer.length} bytes → ${filePath}`);

      const localUrl = `/api/events/${event.id}/image`;
      await this.eventsRepository.update(event.id, { image_url: localUrl } as any);
      console.log(`[AI Image] ✅ DB updated → ${localUrl}`);

    } catch (error) {
      console.error(`[AI Image] ❌ Failed for event ${event.id}:`, error.message);
    }
  }

  /**
   * متد تستی برای تولید دستی عکس برای رویدادهای از قبل ساخته شده
   */
  async generateImageForExistingEvent(eventId: string) {
    const event = await this.findOne(eventId);
    if (!event) throw new Error('Event not found');
    await this.generateAndSaveEventImage(event);
    return { success: true, message: 'Image generation triggered in background' };
  }



  // ورود به لیست انتظار
  async joinWaitlist(eventId: string, userId: string) {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId, is_active: true },
    });
    if (!event) throw new NotFoundException('رویداد یافت نشد');
    if (Number(event.current_bookings || 0) < Number(event.capacity || 0)) {
      throw new BadRequestException('رویداد هنوز ظرفیت دارد؛ می‌توانید مستقیم رزرو کنید');
    }
    await this.dataSource.query(
      `INSERT INTO event_waitlists (event_id, user_id, status, joined_at)
       VALUES ($1, $2, 'waiting', NOW())
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [eventId, userId],
    ).catch(() => {});
    return { status: 'waitlisted', message: 'شما به لیست انتظار اضافه شدید.' };
  }

  // وضعیت رزرو کاربر
  async getReservationStatus(eventId: string, userId: string) {
    const booking = await this.dataSource.query(
      `SELECT id, status, matching_status, group_id, payment_status
       FROM bookings WHERE event_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 1`,
      [eventId, userId],
    ).catch(() => []);
    const waitlist = await this.dataSource.query(
      `SELECT id, status FROM event_waitlists WHERE event_id=$1 AND user_id=$2 LIMIT 1`,
      [eventId, userId],
    ).catch(() => []);
    if (booking[0]) return { reservation_status: booking[0].status, matching_status: booking[0].matching_status, booking_id: booking[0].id };
    if (waitlist[0]) return { reservation_status: 'waitlisted' };
    return { reservation_status: 'available' };
  }
}
