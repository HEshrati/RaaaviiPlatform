"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
exports.calcMatchScore = calcMatchScore;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const typeorm_3 = require("typeorm");
const event_entity_1 = require("./entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const user_entity_1 = require("../../database/entities/user.entity");
// ─── الگوریتم امتیاز مچینگ ─────────────────────────────────────────────────
function calcMatchScore(userProfile, event) {
    let score = 50; // بیس امتیاز
    // ۱. شهر مطابقت دارد؟
    if (event.city && userProfile.city) {
        if (event.city === userProfile.city)
            score += 30;
        else
            score -= 20;
    }
    // ۲. نوع رویداد با شخصیت تطابق دارد؟
    const type = (event.event_type || event.category || '').toLowerCase();
    if (type.includes('hampa') || type.includes('outdoor') || type.includes('هم‌پا')) {
        if (userProfile.location === 'منظره‌ی کوه و جنگل و صدای باد')
            score += 15;
        if (userProfile.introExtro >= 4)
            score += 5;
    }
    if (type.includes('hamneshin') || type.includes('hamghesse') || type.includes('همنشین')) {
        if (userProfile.introExtro <= 2)
            score += 10;
        if (userProfile.vibe === 'یه کافه‌ی آروم و دنج با میزهای همیشگی')
            score += 10;
    }
    if (type.includes('hambazi') || type.includes('hamteymi') || type.includes('هم‌بازی')) {
        if (userProfile.introExtro >= 4)
            score += 10;
        if (userProfile.motivation >= 4)
            score += 5;
    }
    if (type.includes('hamsohbat') || type.includes('hamfekr') || type.includes('هم‌صحبت')) {
        if (userProfile.decision === 'بیشتر با فکر و تحلیل جلو میرم')
            score += 10;
        if (userProfile.introExtro >= 3)
            score += 5;
    }
    if (type.includes('hamamooz') || type.includes('hamkar') || type.includes('هم‌آموز')) {
        if (userProfile.motivation >= 4)
            score += 10;
        if (userProfile.career <= 2)
            score += 8; // دنبال رشده
    }
    // ۳. انرژی رویداد
    const energyHigh = ['hambazi', 'hamteymi', 'هم‌بازی', 'هم‌تیمی'];
    const energyLow = ['hamneshin', 'hamsohbat', 'همنشین', 'هم‌صحبت'];
    if (energyHigh.some(t => type.includes(t)) && userProfile.introExtro >= 4)
        score += 5;
    if (energyLow.some(t => type.includes(t)) && userProfile.introExtro <= 2)
        score += 5;
    // ۴. ظرفیت خالی بونوس
    if (event.capacity - event.current_bookings > 3)
        score += 5;
    return Math.max(0, Math.min(100, score));
}
let EventsService = class EventsService {
    constructor(eventsRepository, bookingsRepository, usersRepository, dataSource) {
        this.eventsRepository = eventsRepository;
        this.bookingsRepository = bookingsRepository;
        this.usersRepository = usersRepository;
        this.dataSource = dataSource;
    }
    async create(createEventDto) {
        // Handle camelCase → snake_case field mapping
        const dto = { ...createEventDto };
        if (dto.startDate && !dto.start_date)
            dto.start_date = new Date(dto.startDate);
        if (dto.endDate && !dto.end_date)
            dto.end_date = new Date(dto.endDate);
        if (!dto.start_date && dto.startDate)
            dto.start_date = new Date(dto.startDate);
        if (!dto.end_date)
            dto.end_date = dto.start_date ? new Date(new Date(dto.start_date).getTime() + 2 * 60 * 60 * 1000) : new Date();
        if (!dto.event_type)
            dto.event_type = dto.category || 'hamneshin';
        if (!dto.price)
            dto.price = 0;
        // camelCase → snake_case برای is_active
        if (dto.isActive !== undefined && dto.is_active === undefined)
            dto.is_active = dto.isActive;
        // اطمینان از فعال بودن پیش‌فرض
        if (dto.is_active === undefined)
            dto.is_active = true;
        const event = this.eventsRepository.create(dto);
        const savedEvent = await this.eventsRepository.save(event);
        // 🔄 تولید خودکار عکس توسط هوش مصنوعی در پس‌زمینه (بدون بلاک کردن پاسخ)
        if (!dto.image_url) {
            this.generateAndSaveEventImage(savedEvent).catch(err => console.error('[AI Image] Background generation failed:', err.message));
        }
        return savedEvent;
    }
    /**
     * لیست رویدادها — اگر پروفایل کاربر بده، با مچینگ مرتب می‌شه
     */
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        // اگه شهر از query نیومد، از پروفایل کاربر بگیر
        let effectiveCity = query.city || '';
        if (!effectiveCity && query.userId) {
            const prof = await this.usersRepository.manager
                .getRepository('profiles')
                .findOne({ where: { user_id: query.userId } })
                .catch(() => null);
            effectiveCity = prof?.city || '';
        }
        const qb = this.eventsRepository
            .createQueryBuilder('event')
            .where('event.is_active = :isActive', { isActive: true });
        if (effectiveCity)
            qb.andWhere('event.city ILIKE :city', { city: `%${effectiveCity}%` });
        if (query.event_type)
            qb.andWhere('event.event_type = :type', { type: query.event_type });
        const [data, total] = await qb
            .orderBy('event.start_date', 'ASC')
            .skip(skip).take(limit * 3) // بیشتر بگیر تا مرتب‌سازی بهتر باشه
            .getManyAndCount();
        let events = data.map((e) => ({
            ...e,
            startDate: e.start_date, // camelCase alias for frontend
            endDate: e.end_date, // camelCase alias for frontend
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
                        matchScore: calcMatchScore(profile, e),
                    }));
                    events.sort((a, b) => b.matchScore - a.matchScore);
                }
            }
            catch { /* بدون مچینگ پیش می‌ریم */ }
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
    async getUserPersonalityProfile(userId) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user)
            return null;
        // دریافت پروفایل کاربر برای شهر و جنسیت
        const profile = await this.usersRepository.manager
            .getRepository('profiles')
            .findOne({ where: { user_id: userId } })
            .catch(() => null);
        const userCity = profile?.city || '';
        const userGender = profile?.gender || '';
        // دریافت آخرین نتیجه تست
        const result = await this.usersRepository.manager
            .getRepository('test_results')
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
    async getGroupRecommendations(userId) {
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
        let groupEvents = [];
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
    /**
     * رزرو رویداد - با بررسی بن و قانون ۲ بار غیاب
     */
    async bookEvent(eventId, userId) {
        const event = await this.eventsRepository.findOne({ where: { id: eventId, is_active: true } });
        if (!event)
            throw new common_1.NotFoundException('رویداد یافت نشد');
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        // بررسی بن
        if (user.isBanned) {
            throw new common_1.BadRequestException('⛔ حساب کاربری شما به دلیل ۲ بار غیاب غیرمجاز مسدود شده است. برای رفع مسدودیت با پشتیبانی تماس بگیرید');
        }
        // بررسی ظرفیت
        if (event.current_bookings >= event.capacity) {
            throw new common_1.BadRequestException('ظرفیت رویداد تکمیل است');
        }
        // بررسی رزرو تکراری
        const existing = await this.bookingsRepository.findOne({
            where: { event_id: eventId, user_id: userId },
        });
        if (existing && existing.status !== 'cancelled') {
            throw new common_1.BadRequestException('قبلاً این رویداد را رزرو کرده‌اید');
        }
        const booking = this.bookingsRepository.create({
            event_id: eventId,
            user_id: userId,
            status: 'confirmed',
            confirmed_at: new Date(),
            booking_code: `RV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        });
        const saved = await this.bookingsRepository.save(booking);
        await this.eventsRepository.increment({ id: eventId }, 'current_bookings', 1);
        // تعداد غیاب‌های قبلی
        const noShowCount = await this.bookingsRepository.count({
            where: { user_id: userId, attended: false },
        });
        return {
            booking: saved,
            ...(noShowCount === 1 ? {
                warning: '⚠️ توجه: یک بار در رویداد قبلی شرکت نکرده‌اید. در صورت عدم شرکت مجدد، حساب شما مسدود خواهد شد.',
            } : {}),
        };
    }
    async findOne(id) {
        const event = await this.eventsRepository.findOne({ where: { id } });
        if (!event)
            throw new common_1.NotFoundException('همنشینی یافت نشد');
        return event;
    }
    async findByCreator(creatorId) {
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
    async update(id, data) {
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
        Object.assign(event, data);
        return await this.eventsRepository.save(event);
    }
    async incrementBookings(id) {
        await this.eventsRepository.increment({ id }, 'current_bookings', 1);
    }
    async decrementBookings(id) {
        await this.eventsRepository.decrement({ id }, 'current_bookings', 1);
    }
    async getLocationForUser(eventId, userId, isAdmin) {
        const event = await this.findOne(eventId);
        const now = new Date();
        const startDate = new Date(event.start_date);
        const msUntilStart = startDate.getTime() - now.getTime();
        const minutesUntilStart = Math.ceil(msUntilStart / (1000 * 60));
        const hoursUntilStart = msUntilStart / (1000 * 60 * 60);
        if (hoursUntilStart > 10) {
            return { location: null, revealed: false, minutesRemaining: minutesUntilStart };
        }
        if (isAdmin) {
            return { location: event.location, revealed: true, minutesRemaining: 0 };
        }
        const booking = await this.bookingsRepository.findOne({
            where: { event_id: eventId, user_id: userId },
        });
        if (!booking) {
            return { location: null, revealed: false, minutesRemaining: minutesUntilStart };
        }
        return { location: event.location, revealed: true, minutesRemaining: 0 };
    }
    async updateLocationAndNotify(eventId, location, city) {
        const event = await this.update(eventId, { location, city });
        const bookings = await this.bookingsRepository.find({
            where: { event_id: eventId },
            relations: ['user'],
        });
        const OTP_API_KEY = process.env.OTP_API_KEY || '';
        const IS_PROD = process.env.NODE_ENV === 'production';
        const SMS_TEMPLATE_ID = parseInt(process.env.LOCATION_CHANGE_TEMPLATE_ID || '100001');
        const results = { notified: 0, failed: 0 };
        for (const booking of bookings) {
            if (!booking.user?.mobileNumber)
                continue;
            try {
                if (IS_PROD && OTP_API_KEY) {
                    const _smsCtrl = new AbortController();
                    setTimeout(() => _smsCtrl.abort(), 8000);
                    await fetch('https://api.sms.ir/v1/send/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-api-key': OTP_API_KEY },
                        body: JSON.stringify({
                            mobile: booking.user.mobileNumber,
                            templateId: SMS_TEMPLATE_ID,
                            parameters: [
                                { name: 'EventTitle', value: event.title },
                                { name: 'NewLocation', value: `${city} - ${location}` },
                            ],
                        }),
                    });
                }
                else {
                }
                results.notified++;
            }
            catch {
                results.failed++;
            }
        }
        return {
            success: true,
            message: `مکان بروزرسانی شد. ${results.notified} نفر اطلاع‌رسانی شدند.`,
            ...results,
        };
    }
    async getEventAttendees(eventId) {
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
    async getAdminStats(creatorId) {
        const events = await this.eventsRepository.find({
            where: { created_by: creatorId },
            order: { start_date: 'DESC' },
        });
        const now = new Date();
        const completed = events.filter((e) => new Date(e.end_date) < now);
        const eventStats = await Promise.all(completed.map(async (ev) => {
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
        }));
        const avgSuccessRate = eventStats.length > 0
            ? Math.round(eventStats.reduce((s, e) => s + e.successRate, 0) / eventStats.length)
            : 0;
        return { events: eventStats, totalEvents: events.length, avgSuccessRate };
    }
    /**
     * ─── تولید خودکار عکس رویداد با هوش مصنوعی ────────────────────────────────
     * این متد در پس‌زمینه اجرا می‌شود و رویداد را بلاک نمی‌کند
     */
    buildImagePrompt(event) {
        const type = (event.event_type || event.category || 'default').toLowerCase();
        const title = event.title || '';
        const city = event.city || 'تهران';
        const BASE = {
            hamneshin: `Cozy warm cafe in ${city}, young iranian adults having friendly gathering, soft amber candlelight, shallow depth of field, cinematic, photorealistic 4k`,
            hambazi: `Group of young iranians laughing playing board games at modern cafe in ${city}, colorful vibrant atmosphere, top-down view, photorealistic 4k`,
            hamsohbat: `Two friends in deep intellectual conversation at a cozy bookshop cafe in ${city}, evening warm light, books on shelves, photorealistic 4k`,
            hamfekr: `Creative brainstorming session in ${city}, young professionals with sticky notes and laptops, bright modern coworking space, photorealistic 4k`,
            hamkar: `Professional team collaboration event in ${city}, handshake and networking, business casual, bright modern office, photorealistic 4k`,
            hamteymi: `Energetic sports team huddle outdoors in ${city}, colorful jerseys, dynamic stadium lighting, team spirit, photorealistic 4k`,
            hampa: `Friends hiking together on beautiful mountain trail near ${city}, golden hour sunlight, green nature, backpacks, photorealistic 4k`,
            hamamooz: `Interactive educational workshop in ${city}, diverse young students learning together around table with laptops, photorealistic 4k`,
            hamghesse: `Intimate storytelling circle in cozy library in ${city}, people gathered around warm candles, soft amber glow, photorealistic 4k`,
            hamziste: `Mindfulness meditation group in peaceful garden in ${city}, soft green tones, zen atmosphere, morning light, photorealistic 4k`,
            hamrovan: `Supportive psychology group therapy session in ${city}, circle of comfortable chairs, calm blue purple tones, safe warm space, photorealistic 4k`,
            hamhonar: `Art workshop in colorful studio in ${city}, people painting together, creative energy, splashes of color, photorealistic 4k`,
            hamvarzesh: `Outdoor fitness group morning run in park in ${city}, energetic movement, sunrise golden light, photorealistic 4k`,
            default: `Community social event in ${city}, diverse young iranian adults smiling and connecting, warm orange ambient light, modern venue, photorealistic 4k`,
        };
        const base = BASE[type] || BASE.default;
        const titleHint = title.length > 3 ? `, event theme: "${title}"` : '';
        return base + titleHint + ', high quality, sharp focus, no text, no watermark';
    }
    async generateAndSaveEventImage(event) {
        const AI_API_URL = process.env.AI_IMAGE_API_URL || 'https://api.gapgpt.app/v1/images/generations';
        const AI_API_KEY = process.env.AI_IMAGE_API_KEY || '';
        const AI_MODEL = process.env.AI_IMAGE_MODEL || 'gapgpt/z-image';
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
            const data = await response.json();
            const imageUrl = data?.data?.[0]?.url || data?.output?.[0] || data?.url;
            if (!imageUrl)
                throw new Error('No image URL in response: ' + JSON.stringify(data).slice(0, 200));
            console.log(`[AI Image] Downloading: ${imageUrl}`);
            const imgResponse = await fetch(imageUrl);
            if (!imgResponse.ok)
                throw new Error('Failed to download image');
            const buffer = Buffer.from(await imgResponse.arrayBuffer());
            const saveDir = '/app/event-images';
            if (!fs.existsSync(saveDir))
                fs.mkdirSync(saveDir, { recursive: true });
            const fileName = `${event.id}.jpg`;
            const filePath = path.join(saveDir, fileName);
            fs.writeFileSync(filePath, buffer);
            console.log(`[AI Image] ✅ Saved ${buffer.length} bytes → ${filePath}`);
            const localUrl = `/api/events/${event.id}/image`;
            await this.eventsRepository.update(event.id, { image_url: localUrl });
            console.log(`[AI Image] ✅ DB updated → ${localUrl}`);
        }
        catch (error) {
            console.error(`[AI Image] ❌ Failed for event ${event.id}:`, error.message);
        }
    }
    /**
     * متد تستی برای تولید دستی عکس برای رویدادهای از قبل ساخته شده
     */
    async generateImageForExistingEvent(eventId) {
        const event = await this.findOne(eventId);
        if (!event)
            throw new Error('Event not found');
        await this.generateAndSaveEventImage(event);
        return { success: true, message: 'Image generation triggered in background' };
    }
    // ورود به لیست انتظار
    async joinWaitlist(eventId, userId) {
        await this.dataSource.query(`INSERT INTO event_waitlists (event_id, user_id, status, joined_at)
       VALUES ($1, $2, 'waiting', NOW())
       ON CONFLICT (event_id, user_id) DO NOTHING`, [eventId, userId]).catch(() => { });
        return { status: 'waitlisted', message: 'شما به لیست انتظار اضافه شدید.' };
    }
    // وضعیت رزرو کاربر
    async getReservationStatus(eventId, userId) {
        const booking = await this.dataSource.query(`SELECT id, status, matching_status, group_id, payment_status
       FROM bookings WHERE event_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 1`, [eventId, userId]).catch(() => []);
        const waitlist = await this.dataSource.query(`SELECT id, status FROM event_waitlists WHERE event_id=$1 AND user_id=$2 LIMIT 1`, [eventId, userId]).catch(() => []);
        if (booking[0])
            return { reservation_status: booking[0].status, matching_status: booking[0].matching_status, booking_id: booking[0].id };
        if (waitlist[0])
            return { reservation_status: 'waitlisted' };
        return { reservation_status: 'available' };
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_2.DataSource])
], EventsService);
