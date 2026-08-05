"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventMergeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMergeService = void 0;
/**
 * سرویس ادغام ایونت‌ها — لایه ۴ اتوماسیون
 * هر ۳۰ دقیقه بررسی می‌کند؛ ایونت‌هایی که ۱۲ ساعت دیگر شروع
 * می‌شوند و ظرفیت کافی ندارند با هم ادغام می‌شوند.
 */
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const event_entity_1 = require("./entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const user_entity_1 = require("../users/entities/user.entity");
const sms_service_1 = require("../sms/sms.service");
let EventMergeService = EventMergeService_1 = class EventMergeService {
    constructor(eventRepo, bookingRepo, userRepo, sms) {
        this.eventRepo = eventRepo;
        this.bookingRepo = bookingRepo;
        this.userRepo = userRepo;
        this.sms = sms;
        this.logger = new common_1.Logger(EventMergeService_1.name);
    }
    async scheduledMerge() {
        this.logger.log('⏰ بررسی ادغام ایونت‌ها...');
        try {
            const r = await this.mergeUpcomingEvents();
            if (r.mergedCount > 0)
                this.logger.log(`✅ ${r.mergedCount} ادغام انجام شد`);
        }
        catch (e) {
            this.logger.error('❌ خطا:', e);
        }
    }
    async mergeUpcomingEvents() {
        const now = new Date();
        const t12 = new Date(now.getTime() + 12 * 3600_000);
        const t13 = new Date(now.getTime() + 13 * 3600_000);
        const events = await this.eventRepo.find({
            where: { start_date: (0, typeorm_2.Between)(t12, t13), is_active: true },
            order: { start_date: 'ASC' },
        });
        if (events.length < 2)
            return { mergedCount: 0, details: [] };
        const groups = this.groupByCategoryCity(events);
        const details = [];
        for (const evts of Object.values(groups)) {
            if (evts.length < 2)
                continue;
            details.push(...await this.mergeGroup(evts));
        }
        return { mergedCount: details.length, details };
    }
    groupByCategoryCity(events) {
        return events.reduce((acc, e) => {
            const k = `${e.event_type || 'g'}_${e.city || 'x'}`;
            (acc[k] = acc[k] || []).push(e);
            return acc;
        }, {});
    }
    async mergeGroup(events) {
        events.sort((a, b) => b.current_bookings - a.current_bookings);
        const details = [];
        for (const src of events.filter(e => e.current_bookings < Math.ceil(e.capacity * 0.5))) {
            const tgt = events.find(e => e.id !== src.id &&
                !e.merged_into &&
                e.current_bookings + src.current_bookings <= e.capacity);
            if (!tgt)
                continue;
            const bookings = await this.bookingRepo.find({
                where: { event_id: src.id, status: 'confirmed' },
                relations: ['user'],
            });
            for (const b of bookings) {
                await this.bookingRepo.update(b.id, {
                    event_id: tgt.id,
                    metadata: { ...(b.metadata || {}), merged_from: src.id, merged_at: new Date().toISOString() },
                });
            }
            await this.eventRepo.update(tgt.id, { current_bookings: tgt.current_bookings + bookings.length });
            await this.eventRepo.update(src.id, { current_bookings: 0, is_active: false, merged_into: tgt.id });
            const mergeDate = new Date(tgt.start_date).toLocaleDateString('fa-IR');
            const mergeTime = new Date(tgt.start_date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            const siteUrl = `${process.env.FRONTEND_URL || 'https://raaviiplatform.com'}/events/${tgt.id}`;
            for (const b of bookings) {
                if (b.user?.mobileNumber)
                    await this.sms.sendMergeNotification(b.user.mobileNumber, tgt.title, mergeDate, mergeTime, siteUrl);
            }
            details.push({ sourceEventId: src.id, targetEventId: tgt.id, movedUsers: bookings.length,
                reason: `ادغام ایونت کم‌ظرفیت (${src.current_bookings}/${src.capacity})` });
            this.logger.log(`✅ ادغام: ${bookings.length} نفر → "${tgt.title}"`);
        }
        return details;
    }
    async manualMerge(sourceEventId, targetEventId) {
        const [src, tgt] = await Promise.all([
            this.eventRepo.findOne({ where: { id: sourceEventId } }),
            this.eventRepo.findOne({ where: { id: targetEventId } }),
        ]);
        if (!src || !tgt)
            throw new Error('ایونت یافت نشد');
        if (tgt.current_bookings + src.current_bookings > tgt.capacity)
            throw new Error('ظرفیت کافی نیست');
        const bookings = await this.bookingRepo.find({ where: { event_id: sourceEventId, status: 'confirmed' }, relations: ['user'] });
        for (const b of bookings)
            await this.bookingRepo.update(b.id, { event_id: targetEventId,
                metadata: { ...(b.metadata || {}), merged_from: sourceEventId, manual: true } });
        await this.eventRepo.update(targetEventId, { current_bookings: tgt.current_bookings + bookings.length });
        await this.eventRepo.update(sourceEventId, { current_bookings: 0, is_active: false });
        const siteUrl = `${process.env.FRONTEND_URL || 'https://raaviiplatform.com'}/events/${targetEventId}`;
        const mergeDate = new Date(tgt.start_date).toLocaleDateString('fa-IR');
        const mergeTime = new Date(tgt.start_date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        for (const b of bookings)
            if (b.user?.mobileNumber)
                await this.sms.sendMergeNotification(b.user.mobileNumber, tgt.title, mergeDate, mergeTime, siteUrl);
        return { sourceEventId, targetEventId, movedUsers: bookings.length, reason: 'ادغام دستی ادمین' };
    }
};
exports.EventMergeService = EventMergeService;
__decorate([
    (0, schedule_1.Cron)('*/30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventMergeService.prototype, "scheduledMerge", null);
exports.EventMergeService = EventMergeService = EventMergeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        sms_service_1.SmsService])
], EventMergeService);
