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
var SmsReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsReminderService = void 0;
/**
 * سرویس یادآوری SMS — لایه ۴ اتوماسیون
 * برای کاربران ثبت‌نام‌شده بدون رزرو، روزانه پیامک می‌فرستد
 */
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const user_entity_1 = require("../users/entities/user.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
const sms_service_1 = require("../sms/sms.service");
let SmsReminderService = SmsReminderService_1 = class SmsReminderService {
    constructor(userRepo, bookingRepo, smartProfileRepo, sms) {
        this.userRepo = userRepo;
        this.bookingRepo = bookingRepo;
        this.smartProfileRepo = smartProfileRepo;
        this.sms = sms;
        this.logger = new common_1.Logger(SmsReminderService_1.name);
    }
    async scheduledReminder() {
        this.logger.log('📨 ارسال یادآوری به کاربران بدون رزرو...');
        const r = await this.sendReminderToUnbookedUsers();
        this.logger.log(`✅ ${r.sent} ارسال | ${r.skipped} رد | ${r.failed} خطا`);
    }
    async sendReminderToUnbookedUsers() {
        const FRONTEND = process.env.FRONTEND_URL || 'https://raaviiplatform.com';
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);
        const stats = { sent: 0, skipped: 0, failed: 0 };
        // ✅ اصلاح شد: createdAt (نام واقعی ستون) و isBanned به جای is_active
        const users = await this.userRepo.find({
            where: { createdAt: (0, typeorm_2.LessThan)(sevenDaysAgo), isBanned: false },
            select: ['id', 'mobileNumber', 'name', 'createdAt'],
        });
        for (const user of users) {
            if (!user.mobileNumber) {
                stats.skipped++;
                continue;
            }
            const hasBooking = await this.bookingRepo.findOne({ where: { user_id: user.id, status: 'confirmed' } });
            if (hasBooking) {
                stats.skipped++;
                continue;
            }
            const sp = await this.smartProfileRepo.findOne({ where: { user_id: user.id } });
            // ✅ اصلاح شد: last_reminder_at اکنون در entity وجود دارد
            if (sp?.last_reminder_at) {
                const days = (Date.now() - new Date(sp.last_reminder_at).getTime()) / 86400_000;
                if (days < 14) {
                    stats.skipped++;
                    continue;
                }
            }
            const link = `${FRONTEND}/events?utm_source=sms&utm_medium=reminder&ref=${user.id}`;
            const name = user.name?.split(' ')[0] || 'دوست';
            const res = await this.sms.sendBookingReminder(user.mobileNumber, name, link);
            if (res.success) {
                stats.sent++;
                await this.updateReminderTime(user.id, sp);
            }
            else
                stats.failed++;
            await new Promise((r) => setTimeout(r, 100));
        }
        return stats;
    }
    async sendManualReminder(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user?.mobileNumber)
            return { success: false, message: 'کاربر یا موبایل یافت نشد' };
        const link = `${process.env.FRONTEND_URL || 'https://raaviiplatform.com'}/events?ref=${userId}`;
        const name = user.name?.split(' ')[0] || 'دوست';
        return this.sms.sendBookingReminder(user.mobileNumber, name, link);
    }
    async updateReminderTime(userId, sp) {
        if (sp) {
            await this.smartProfileRepo.update(sp.id, { last_reminder_at: new Date() });
        }
        else {
            await this.smartProfileRepo.save(this.smartProfileRepo.create({ user_id: userId, last_reminder_at: new Date() }));
        }
    }
};
exports.SmsReminderService = SmsReminderService;
__decorate([
    (0, schedule_1.Cron)('0 10 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SmsReminderService.prototype, "scheduledReminder", null);
exports.SmsReminderService = SmsReminderService = SmsReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(2, (0, typeorm_1.InjectRepository)(smart_profile_entity_1.SmartProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        sms_service_1.SmsService])
], SmsReminderService);
