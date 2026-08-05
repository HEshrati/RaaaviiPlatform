import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HamravanSession } from './entities/hamravan-session.entity';
import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from '../payment/payment.service';
import { mutationRows } from '../../common/database/query-result';

const SESSION_PROTOCOL = [
  { step: 1, title: 'معرفی چارچوب خدمت', description: 'توضیح اینکه این جلسه چیست و چه انتظاری می‌توان داشت' },
  { step: 2, title: 'روشن‌سازی انتظار', description: 'مراجع چه می‌خواهد از این جلسه به دست بیاورد؟' },
  { step: 3, title: 'بررسی مسئله محوری', description: 'مسئله اصلی که مراجع با آن روبروست چیست؟' },
  { step: 4, title: 'بازتاب هیجانی/شناختی', description: 'انعکاس آنچه شنیده شده' },
  { step: 5, title: 'صورت‌بندی اولیه', description: 'کمک به کاربر برای فهمیدن بهتر مسئله‌اش' },
  { step: 6, title: 'پیشنهاد مسیر بعدی', description: 'راهنمایی برای قدم بعدی' },
];

const REFERRAL_PATHS = {
  self_help:   'ادامه با منابع خودیاری راوی',
  group_event: 'شرکت در رویدادهای گروهی راوی',
  therapy:     'ارجاع به روان‌درمانی تخصصی',
  counseling:  'مشاوره دوره‌ای',
  crisis:      'ارجاع فوری به متخصص',
};

const NEEDS_ASSESSMENT_QUESTIONS = [
  {
    id: 'main_concern', step: 1,
    question: 'در حال حاضر مهم‌ترین دغدغه شما چیست؟',
    type: 'single_select',
    options: [
      { value: 'anxiety',       label: 'اضطراب و نگرانی' },
      { value: 'depression',    label: 'افسردگی یا بی‌انگیزگی' },
      { value: 'relationship',  label: 'رابطه عاطفی' },
      { value: 'family',        label: 'خانواده' },
      { value: 'marriage',      label: 'ازدواج یا پیش از ازدواج' },
      { value: 'loneliness',    label: 'تنهایی' },
      { value: 'self_esteem',   label: 'اعتمادبه‌نفس' },
      { value: 'procrastination', label: 'اهمال‌کاری' },
      { value: 'decision',      label: 'تصمیم‌گیری' },
      { value: 'anger',         label: 'خشم' },
      { value: 'grief',         label: 'سوگ یا فقدان' },
      { value: 'work_study',    label: 'مشکلات شغلی/تحصیلی' },
      { value: 'crisis',        label: 'بحران فعلی' },
      { value: 'unknown',       label: 'نمی‌دانم، فقط احساس خوبی ندارم' },
      { value: 'other',         label: 'سایر موارد' },
    ],
  },
  {
    id: 'onset', step: 2,
    question: 'این دغدغه از چه زمانی شروع شده است؟',
    type: 'single_select',
    options: [
      { value: 'lt_week',   label: 'کمتر از یک هفته' },
      { value: 'weeks',     label: 'چند هفته' },
      { value: 'months',    label: 'چند ماه' },
      { value: 'gt_6m',     label: 'بیش از شش ماه' },
      { value: 'long_time', label: 'مدت طولانی است' },
      { value: 'unsure',    label: 'مطمئن نیستم' },
    ],
  },
  {
    id: 'severity', step: 3,
    question: 'شدت این مسئله را چقدر ارزیابی می‌کنید؟',
    type: 'scale_1_10',
  },
  {
    id: 'impact', step: 4,
    question: 'این مسئله چقدر روی زندگی روزمره شما اثر گذاشته است؟',
    type: 'single_select',
    options: [
      { value: 'low',      label: 'کم' },
      { value: 'medium',   label: 'متوسط' },
      { value: 'high',     label: 'زیاد' },
      { value: 'very_high',label: 'خیلی زیاد' },
    ],
  },
  {
    id: 'help_type', step: 5,
    question: 'بیشتر دنبال چه نوع کمکی هستید؟',
    type: 'single_select',
    options: [
      { value: 'be_heard',     label: 'فقط می‌خواهم حرف بزنم و شنیده شوم' },
      { value: 'understand',   label: 'می‌خواهم مسئله‌ام را بهتر بفهمم' },
      { value: 'practical',    label: 'دنبال راهکار عملی هستم' },
      { value: 'decision_help',label: 'می‌خواهم برای یک تصمیم مهم کمک بگیرم' },
      { value: 'couples',      label: 'نیاز به مشاوره رابطه یا ازدواج دارم' },
      { value: 'specialized',  label: 'نیاز به درمان تخصصی‌تر دارم' },
      { value: 'unsure',       label: 'مطمئن نیستم' },
    ],
  },
  {
    id: 'gender_preference', step: 6,
    question: 'ترجیح شما درباره روانشناس چیست؟',
    type: 'single_select',
    options: [
      { value: 'female', label: 'خانم' },
      { value: 'male',   label: 'آقا' },
      { value: 'any',    label: 'فرقی ندارد' },
    ],
  },
  {
    id: 'style_preference', step: 7,
    question: 'ترجیح شما درباره سبک جلسه چیست؟',
    type: 'single_select',
    options: [
      { value: 'supportive',   label: 'حمایتی و همدلانه' },
      { value: 'structured',   label: 'ساختاریافته و راهکارمحور' },
      { value: 'analytical',   label: 'عمیق و تحلیلی' },
      { value: 'educational',  label: 'آموزشی و مهارت‌محور' },
      { value: 'mixed',        label: 'ترکیبی' },
      { value: 'unsure',       label: 'نمی‌دانم' },
    ],
  },
  {
    id: 'session_type', step: 8,
    question: 'نوع برگزاری مورد نظر شما چیست؟',
    type: 'single_select',
    options: [
      { value: 'online',    label: 'آنلاین' },
      { value: 'in_person', label: 'حضوری' },
      { value: 'both',      label: 'هر دو' },
    ],
  },
  {
    id: 'immediate_risk', step: 9,
    question: 'آیا در حال حاضر احساس خطر فوری برای خود یا دیگران دارید؟',
    type: 'single_select',
    critical: true,
    options: [
      { value: 'no',          label: 'خیر' },
      { value: 'yes',         label: 'بله' },
      { value: 'prefer_not',  label: 'ترجیح می‌دهم توضیح ندهم' },
    ],
  },
];

const CONCERN_KEYWORDS: Record<string, string[]> = {
  anxiety:         ['اضطراب', 'نگرانی', 'استرس'],
  depression:      ['افسردگی', 'بی‌انگیزگی', 'خلق'],
  relationship:    ['رابطه', 'عاطفی', 'زوج'],
  family:          ['خانواده', 'فرزندپروری'],
  marriage:        ['ازدواج', 'پیش از ازدواج', 'زوج'],
  loneliness:      ['تنهایی', 'انزوا', 'ارتباط'],
  self_esteem:     ['اعتمادبه‌نفس', 'عزت‌نفس'],
  procrastination: ['اهمال‌کاری', 'تعویق', 'انگیزه'],
  decision:        ['تصمیم‌گیری', 'رشد فردی'],
  anger:           ['خشم', 'مدیریت هیجان'],
  grief:           ['سوگ', 'فقدان', 'از دست دادن'],
  work_study:      ['شغلی', 'تحصیلی', 'فرسودگی'],
  crisis:          ['بحران', 'اورژانس'],
  unknown:         [],
  other:           [],
};

const STYLE_KEYWORDS: Record<string, string[]> = {
  supportive:  ['حمایتی', 'همدلانه', 'انسان‌گرا'],
  structured:  ['ساختاریافته', 'راهکارمحور', 'CBT', 'رفتاری'],
  analytical:  ['تحلیلی', 'روان‌کاوی', 'عمیق'],
  educational: ['آموزشی', 'مهارت‌محور'],
  mixed:       ['ترکیبی'],
  unsure:      [],
};

function textOf(...vals: any[]): string {
  return vals
    .flat()
    .filter(Boolean)
    .map(v => (typeof v === 'string' ? v : JSON.stringify(v)))
    .join(' ')
    .toLowerCase();
}

@Injectable()
export class HamravanService {
  constructor(
    @InjectRepository(HamravanSession)
    private sessionRepo: Repository<HamravanSession>,
    private dataSource: DataSource,
    private walletService: WalletService,
    private paymentService: PaymentService,
  ) {}

  getProtocol() { return { protocol: SESSION_PROTOCOL, referral_paths: REFERRAL_PATHS }; }

  getNeedsAssessmentQuestions() {
    return { questions: NEEDS_ASSESSMENT_QUESTIONS };
  }

  async submitNeedsAssessment(userId: string, answers: Record<string, any>) {
    const isCrisis = answers.immediate_risk === 'yes';

    let session = await this.sessionRepo.findOne({ where: { user_id: userId, status: 'pending' } });
    const dominantNeed = answers.main_concern || null;

    if (session) {
      await this.sessionRepo.update(session.id, {
        dominant_need: dominantNeed,
        pre_session_data: answers,
        referral_path: isCrisis ? 'crisis' : session.referral_path,
      });
    } else {
      session = await this.sessionRepo.save(this.sessionRepo.create({
        user_id: userId,
        status: 'pending',
        dominant_need: dominantNeed,
        pre_session_data: answers,
        referral_path: isCrisis ? 'crisis' : undefined,
      }));
    }

    if (isCrisis) {
      await this.dataSource.query(`
        INSERT INTO notifications (user_id, title, body, type, metadata)
        SELECT u.id, $1, $2, 'admin_alert', $3
        FROM users u WHERE u.role = 'admin' LIMIT 5
      `, [
        '⚠️ هشدار ریسک فوری — همروان',
        'یک کاربر در نیازسنجی همروان احساس خطر فوری اعلام کرده است.',
        JSON.stringify({ sessionId: session.id, userId }),
      ]).catch(() => {});
    }

    return {
      sessionId: session.id,
      isCrisis,
      message: isCrisis
        ? 'متوجه شدیم که این روزها شرایط سختی را تجربه می‌کنید. راوی جای اورژانس نیست، اما می‌توانیم شما را سریع‌تر به روانشناسی با تجربه مدیریت بحران وصل کنیم.'
        : 'ممنون از پاسخ‌هاتون. حالا می‌تونید روانشناسان پیشنهادی یا کل فهرست رو ببینید.',
      crisisResources: isCrisis ? {
        note: 'اگر در این لحظه خطر فوری برای جان خود یا دیگران وجود دارد، لطفاً با اورژانس اجتماعی یا ۱۲۳ تماس بگیرید.',
      } : undefined,
    };
  }

  async getSuggestedPsychologists(userId: string, city?: string, sessionId?: string) {
    let userCity = city;
    let answers: Record<string, any> | null = null;

    if (sessionId) {
      const s = await this.sessionRepo.findOne({ where: { id: sessionId, user_id: userId } });
      answers = s?.pre_session_data || null;
    } else {
      const latest = await this.sessionRepo.findOne({
        where: { user_id: userId, status: 'pending' },
        order: { created_at: 'DESC' },
      });
      answers = latest?.pre_session_data || null;
    }

    if (!userCity) {
      const profile = await this.dataSource.query(
        `SELECT city FROM profiles WHERE user_id=$1`, [userId]
      );
      userCity = profile[0]?.city;
    }

    const params: any[] = [];
    let cityFilter = '';
    if (userCity) {
      params.push(userCity);
      cityFilter = `AND pp.city = $${params.length}`;
    }

    let sessionTypeFilter = '';
    if (answers?.session_type === 'online') sessionTypeFilter = `AND pts.session_type = 'online'`;
    if (answers?.session_type === 'in_person') sessionTypeFilter = `AND pts.session_type = 'in_person'`;

    const rows = await this.dataSource.query(`
      SELECT DISTINCT ON (pp.id)
        pp.id as psychologist_profile_id, pp.user_id,
        pp.specialty, pp.specialties, pp.approach, pp.bio, pp.session_price,
        pp.city, pp.rating, pp.total_sessions, pp.trust_score,
        pp.mbti_expertise, pp.attachment_expertise, pp.online_available,
        COALESCE(pp.first_name,'') || ' ' || COALESCE(pp.last_name,'') as full_name,
        pr.avatar_url,
        pts.id as next_slot_id,
        pts.start_datetime as next_available,
        pts.session_type as next_session_type,
        COUNT(pts2.id) OVER (PARTITION BY pp.id) as available_slots_count
      FROM psychologist_profiles pp
      LEFT JOIN profiles pr ON pr.user_id = pp.user_id
      LEFT JOIN psychologist_time_slots pts ON
        pts.psychologist_id = pp.id AND pts.status = 'available'
        AND pts.publish_to_hamravan = true AND pts.start_datetime > NOW()
        ${sessionTypeFilter}
      LEFT JOIN psychologist_time_slots pts2 ON
        pts2.psychologist_id = pp.id AND pts2.status = 'available'
        AND pts2.publish_to_hamravan = true AND pts2.start_datetime > NOW()
      WHERE pp.professional_status = 'active'
        AND pp.public_profile_status = 'visible'
        ${cityFilter}
      ORDER BY pp.id, pts.start_datetime ASC
      LIMIT 50
    `, params);

    const scored = rows.map((p: any) => this.scorePsychologist(p, answers));
    scored.sort((a: any, b: any) => b._score - a._score);

    return {
      assessment: answers,
      psychologists: scored.slice(0, 30),
    };
  }

  private scorePsychologist(p: any, answers: Record<string, any> | null) {
    let score = 40;
    const reasons: string[] = [];

    if (!answers) {
      return { ...p, _score: score + (p.available_slots_count > 0 ? 5 : 0), match_reason: null, match_tags: [] };
    }

    const profileText = textOf(p.specialty, p.specialties, p.approach, p.bio, p.mbti_expertise, p.attachment_expertise);

    const concernWords = CONCERN_KEYWORDS[answers.main_concern] || [];
    const concernMatch = concernWords.some(w => profileText.includes(w.toLowerCase()));
    if (concernMatch) { score += 25; reasons.push('تجربه در حوزه دغدغه فعلی شما'); }

    const severity = Number(answers.severity) || 0;
    if (severity >= 7) {
      if ((p.total_sessions || 0) > 20) { score += 15; reasons.push('تجربه بالا با موارد شدیدتر'); }
      if ((p.trust_score || 0) > 70) score += 10;
    }

    const styleWords = STYLE_KEYWORDS[answers.style_preference] || [];
    const styleMatch = styleWords.some(w => profileText.includes(w.toLowerCase()));
    if (styleMatch) { score += 20; reasons.push('سبک جلسه نزدیک به ترجیح شما'); }

    if (answers.session_type === 'online' && p.online_available) { score += 8; }
    if (answers.session_type === 'in_person' && p.next_session_type === 'in_person') { score += 8; }

    if (p.next_available) {
      const hoursUntil = (new Date(p.next_available).getTime() - Date.now()) / 36e5;
      if (hoursUntil >= 0 && hoursUntil <= 72) { score += 12; reasons.push('دارای زمان خالی نزدیک'); }
    }

    if ((p.rating || 0) >= 4.5) { score += 8; }

    if (answers.immediate_risk === 'yes' && (p.trust_score || 0) > 80) {
      score += 15; reasons.push('واجد شرایط رسیدگی به موارد فوری');
    }

    const tags: string[] = [];
    if (concernMatch) tags.push('مناسب دغدغه فعلی شما');
    if (styleMatch) tags.push('نزدیک‌تر به سبک ارتباطی شما');
    if (p.next_available) tags.push('دارای زمان خالی نزدیک');
    if ((p.total_sessions || 0) > 20 && severity >= 7) tags.push('تجربه بیشتر در این حوزه');

    const match_reason = reasons.length
      ? `این روانشناس به دلیل ${reasons.join('، ')}، برای دغدغه فعلی شما پیشنهاد شده است.`
      : null;

    return { ...p, _score: score, match_reason, match_tags: tags };
  }

  async createSession(userId: string, preData: any) {
    const session = this.sessionRepo.create({
      user_id: userId, status: 'pending',
      dominant_need: preData.dominant_need || null,
      pre_session_data: preData,
    });
    return this.sessionRepo.save(session);
  }

  async bookSlot(userId: string, slotId: string, dominantNeed?: string, paymentMethod: 'zarinpal' | 'wallet' = 'zarinpal') {
    // نکته: pts.* ستون session_price را ندارد، باید صریحاً از pp انتخاب شود (باگ قبلی که رزرو همیشه مجانی می‌شد)
    const slots = await this.dataSource.query(`
      SELECT pts.*, pp.id as psych_profile_id, pp.user_id as psych_user_id, pp.session_price as session_price
      FROM psychologist_time_slots pts
      JOIN psychologist_profiles pp ON pp.id = pts.psychologist_id
      WHERE pts.id = $1 AND pts.status = 'available'
    `, [slotId]);

    if (!slots.length) throw new BadRequestException('این اسلات در دسترس نیست');
    const slot = slots[0];
    const price = Number(slot.session_price) || 0;

    const upd = mutationRows(await this.dataSource.query(`
      UPDATE psychologist_time_slots SET status='reserved', booked_by=$1, booked_at=NOW()
      WHERE id=$2 AND status='available' RETURNING id
    `, [userId, slotId]));
    if (!upd.length) throw new BadRequestException('رزرو انجام نشد');

    let session = await this.sessionRepo.findOne({ where: { user_id: userId, status: 'pending' } });
    if (session) {
      await this.sessionRepo.update(session.id, {
        psychologist_id: slot.psych_profile_id,
        scheduled_at: slot.start_datetime,
        status: price > 0 ? 'pending_payment' : 'booked',
        dominant_need: dominantNeed,
      });
    } else {
      session = await this.sessionRepo.save(this.sessionRepo.create({
        user_id: userId,
        psychologist_id: slot.psych_profile_id,
        scheduled_at: slot.start_datetime,
        status: price > 0 ? 'pending_payment' : 'booked',
        dominant_need: dominantNeed,
      }));
    }

    // جلسه رایگان (قیمت صفر) - تایید فوری مثل قبل
    if (price <= 0) {
      await this.dataSource.query(`
        INSERT INTO psychologist_bookings (user_id, psychologist_id, slot_id, status, amount)
        VALUES ($1, $2, $3, 'confirmed', $4)
        ON CONFLICT DO NOTHING
      `, [userId, slot.psych_profile_id, slotId, 0]);
      await this.sessionRepo.update(session.id, { status: 'booked' });
      return {
        success: true,
        session_id: session.id,
        slot_id: slotId,
        scheduled_at: slot.start_datetime,
        session_type: slot.session_type,
        message: 'جلسه با موفقیت رزرو شد',
      };
    }

    // ثبت رزرو در وضعیت در انتظار پرداخت
    await this.dataSource.query(`
      INSERT INTO psychologist_bookings (user_id, psychologist_id, slot_id, status, amount)
      VALUES ($1, $2, $3, 'pending_payment', $4)
      ON CONFLICT DO NOTHING
    `, [userId, slot.psych_profile_id, slotId, price]);

    // پرداخت از کیف پول - تایید فوری
    if (paymentMethod === 'wallet') {
      try {
        await this.dataSource.transaction(async (manager) => {
          await this.walletService.debitWallet(userId, price, 'رزرو جلسه همروان', undefined, manager);
          await manager.query(
            `UPDATE psychologist_bookings SET status='confirmed',updated_at=NOW() WHERE slot_id=$1 AND user_id=$2`,
            [slotId, userId],
          );
          await manager.query(
            `UPDATE hamravan_sessions SET status='booked' WHERE id=$1`,
            [session.id],
          );
        });
      } catch (err: any) {
        // برگرداندن اسلات به حالت آزاد چون پرداخت ناموفق بود
        await this.dataSource.query(
          `UPDATE psychologist_time_slots SET status='available', booked_by=NULL, booked_at=NULL WHERE id=$1`,
          [slotId],
        );
        throw new BadRequestException(err.message || 'موجودی کیف پول کافی نیست');
      }
      return {
        success: true,
        session_id: session.id,
        slot_id: slotId,
        scheduled_at: slot.start_datetime,
        session_type: slot.session_type,
        message: 'پرداخت از کیف پول انجام شد و جلسه رزرو شد',
      };
    }

    // پرداخت با زرین‌پال
    try {
      const paymentResult = await this.paymentService.requestPayment({
        userId,
        amount: price,
        description: 'رزرو جلسه همروان',
        type: 'psychologist_booking' as any,
      });
      // metadata شامل slotId/sessionId برای تایید بعد از بازگشت از درگاه لازم است؛
      // چون requestPayment فعلاً metadata سفارشی نمی‌گیرد، اینجا مستقیم ذخیره می‌کنیم
      await this.dataSource.query(
        `UPDATE payments SET metadata = metadata || $1::jsonb WHERE authority = $2`,
        [JSON.stringify({ slotId, sessionId: session.id }), paymentResult.authority],
      );
      return {
        success: true,
        session_id: session.id,
        slot_id: slotId,
        paymentUrl: paymentResult.paymentUrl,
        authority: paymentResult.authority,
        message: 'در حال انتقال به درگاه پرداخت',
      };
    } catch (err: any) {
      await this.dataSource.query(
        `UPDATE psychologist_time_slots SET status='available', booked_by=NULL, booked_at=NULL WHERE id=$1`,
        [slotId],
      );
      throw new BadRequestException(err.message || 'خطا در اتصال به درگاه پرداخت');
    }
  }

  async completeSession(userId: string, sessionId: string, postData: any, referralPath: string, notes: string) {
    const owned = await this.sessionRepo.findOne({ where: { id: sessionId, user_id: userId } });
    if (!owned) throw new BadRequestException('این جلسه یافت نشد یا متعلق به شما نیست');

    await this.sessionRepo.update(sessionId, {
      status: 'completed', completed_at: new Date(),
      post_session_data: postData, referral_path: referralPath, session_notes: notes,
    });

    await this.dataSource.query(`
      UPDATE psychologist_time_slots SET status='completed'
      WHERE booked_by = (SELECT user_id FROM hamravan_sessions WHERE id=$1)
        AND start_datetime = (SELECT scheduled_at FROM hamravan_sessions WHERE id=$1)
    `, [sessionId]).catch(() => {});

    return this.sessionRepo.findOne({ where: { id: sessionId } });
  }

  async getMySessions(userId: string) {
    return this.dataSource.query(`
      SELECT
        hs.*,
        COALESCE(pp.first_name,'') || ' ' || COALESCE(pp.last_name,'') as psychologist_name,
        pp.specialty, pp.city as psychologist_city,
        pr.avatar_url
      FROM hamravan_sessions hs
      LEFT JOIN psychologist_profiles pp ON pp.id = hs.psychologist_id
      LEFT JOIN profiles pr ON pr.user_id = pp.user_id
      WHERE hs.user_id = $1
      ORDER BY hs.created_at DESC
    `, [userId]);
  }

  async getAvailableSlots(city?: string, sessionType?: string) {
    const params: any[] = [];
    let filters = '';
    if (city) { params.push(city); filters += ` AND pp.city = $${params.length}`; }
    if (sessionType) { params.push(sessionType); filters += ` AND pts.session_type = $${params.length}`; }

    // باگ بحرانی امنیتی رفع‌شده: شرط قبلی
    //   pp.public_profile_status IN ('visible', 'hidden')
    // عملاً هیچ فیلتری نداشت و تمام روانشناسان (از جمله تاییدنشده‌ها) را نشان می‌داد.
    // بر طبق پروتکل، فقط روانشناسانی که هر دو شرط زیر را دارند باید دیده شوند:
    //   - professional_status = 'active' (تاییدشده توسط ادمین یا سیستم)
    //   - public_profile_status = 'visible' (آماده نمایش عمومی)
    // همچنین شرط قبلی professional_status IN ('approved', 'active') اشتباه بود چون
    // پس از تایید، professional_status همیشه 'active' می‌شود نه 'approved'.
    return this.dataSource.query(`
      SELECT
        pts.id as slot_id, pts.start_datetime, pts.end_datetime, pts.session_type,
        pts.location_description,
        pp.id as psychologist_id, pp.specialty, pp.bio, pp.session_price, pp.city,
        COALESCE(pp.first_name,'') || ' ' || COALESCE(pp.last_name,'') as psychologist_name,
        pr.avatar_url
      FROM psychologist_time_slots pts
      JOIN psychologist_profiles pp ON pp.id = pts.psychologist_id
      LEFT JOIN profiles pr ON pr.user_id = pp.user_id
      WHERE pts.status = 'available' AND pts.publish_to_hamravan = true
        AND pts.start_datetime > NOW()
        AND pp.professional_status = 'active'
        AND pp.public_profile_status = 'visible'
        ${filters}
      ORDER BY pts.start_datetime ASC LIMIT 50
    `, params);
  }
}

