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
var BaleSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaleSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bale_bot_service_1 = require("./bale-bot.service");
let BaleSchedulerService = BaleSchedulerService_1 = class BaleSchedulerService {
    constructor(ds, bale) {
        this.ds = ds;
        this.bale = bale;
        this.logger = new common_1.Logger(BaleSchedulerService_1.name);
    }
    /** هر ۳۰ دقیقه — یادآوری پرداخت رهاشده */
    async checkAbandonedPayments() {
        // رزروهایی که locked_until داشتن و پرداخت نشدن
        const rows = await this.ds.query(`
      SELECT
        b.id, b.user_id, b.amount_paid, b.locked_until,
        e.title, e.start_date, e.location, e.city, e.price,
        u."mobileNumber" as phone
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN events e ON e.id = b.event_id
      WHERE b.payment_status IN ('pending','unpaid')
        AND b.status NOT IN ('cancelled','confirmed')
        AND b.created_at < NOW() - INTERVAL '2 hours'
        AND b.created_at > NOW() - INTERVAL '26 hours'
        AND b.id::text NOT IN (
          SELECT booking_id::text FROM bale_payment_reminders
          WHERE reminded_at > NOW() - INTERVAL '24 hours'
        )
      LIMIT 20
    `).catch(() => []);
        for (const r of rows) {
            const sent = await this.bale.sendAbandonedPaymentReminder(r.phone, {
                id: r.id,
                amount: r.price || r.amount_paid,
                title: r.title || 'رویداد راوی',
            });
            if (sent) {
                await this.ds.query(`
          INSERT INTO bale_payment_reminders (booking_id, user_id, phone, reminded_at)
          VALUES ($1, $2, $3, NOW())
        `, [r.id, r.user_id, r.phone]).catch(() => { });
                this.logger.log(`Abandoned payment reminder → ${r.phone}`);
            }
        }
    }
    /** هر ساعت — چک ظرفیت رویدادها */
    async checkEventCapacity() {
        // رویدادهایی که به ظرفیت رسیدن و کاربرانی که قبلاً لاک کرده بودن
        const rows = await this.ds.query(`
      SELECT DISTINCT
        e.id, e.title, e.start_date, e.location, e.city, e.price,
        b.user_id, u."mobileNumber" as phone
      FROM events e
      JOIN bookings b ON b.event_id = e.id
      JOIN users u ON u.id = b.user_id
      WHERE e.is_active = true
        AND e.current_bookings >= e.capacity
        AND b.status = 'pending'
        AND b.payment_status IN ('pending','unpaid')
        AND b.created_at > NOW() - INTERVAL '48 hours'
      LIMIT 50
    `).catch(() => []);
        for (const r of rows) {
            await this.bale.sendCapacityReachedNotification(r.phone, {
                id: r.id,
                title: r.title,
                date: r.start_date ? new Date(r.start_date).toLocaleDateString('fa-IR') : '',
                time: r.start_date ? new Date(r.start_date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '',
                location: r.location || r.city || 'آنلاین',
                price: r.price,
            });
        }
    }
    /** هر روز ساعت ۹ — یادآوری رویداد فردا */
    async sendEventReminders() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        const rows = await this.ds.query(`
      SELECT
        b.id, e.title, e.start_date, e.location, e.city, e.is_online,
        e.meeting_link, u."mobileNumber" as phone, u.name
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      JOIN events e ON e.id = b.event_id
      WHERE b.status = 'confirmed'
        AND b.payment_status = 'paid'
        AND DATE(e.start_date) = $1::date
      LIMIT 100
    `, [dateStr]).catch(() => []);
        for (const r of rows) {
            const startDate = r.start_date ? new Date(r.start_date) : null;
            await this.bale.sendEventReminder(r.phone, {
                title: r.title,
                date: startDate ? startDate.toLocaleDateString('fa-IR') : '',
                time: startDate ? startDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '',
                location: r.is_online ? `آنلاین\n🔗 لینک: ${r.meeting_link || ''}` : (r.location || r.city || ''),
            });
            this.logger.log(`Event reminder → ${r.phone} for ${r.title}`);
        }
    }
    /** هر دوشنبه ساعت ۱۰ — پیشنهادات هفتگی */
    async sendWeeklyRecommendations() {
        const users = await this.ds.query(`
      SELECT b.phone, b.chat_id, u.id as user_id
      FROM bale_user_chats b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.is_active = true
        AND b.user_id IS NOT NULL
      LIMIT 100
    `).catch(() => []);
        const events = await this.ds.query(`
      SELECT id, title, start_date, location, city, price, is_online, image_url
      FROM events
      WHERE is_active = true
        AND start_date > NOW()
        AND current_bookings < capacity
      ORDER BY start_date ASC
      LIMIT 3
    `).catch(() => []);
        for (const user of users) {
            if (events.length > 0) {
                const enriched = events.map((e) => ({
                    ...e,
                    date: e.start_date ? new Date(e.start_date).toLocaleDateString('fa-IR') : '',
                    time: e.start_date ? new Date(e.start_date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '',
                    location: e.is_online ? 'آنلاین' : (e.location || e.city),
                }));
                await this.bale.sendEventRecommendations(user.phone, enriched);
            }
        }
    }
};
exports.BaleSchedulerService = BaleSchedulerService;
__decorate([
    (0, schedule_1.Cron)('0 */30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BaleSchedulerService.prototype, "checkAbandonedPayments", null);
__decorate([
    (0, schedule_1.Cron)('0 0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BaleSchedulerService.prototype, "checkEventCapacity", null);
__decorate([
    (0, schedule_1.Cron)('0 0 9 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BaleSchedulerService.prototype, "sendEventReminders", null);
__decorate([
    (0, schedule_1.Cron)('0 0 10 * * 1'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BaleSchedulerService.prototype, "sendWeeklyRecommendations", null);
exports.BaleSchedulerService = BaleSchedulerService = BaleSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        bale_bot_service_1.BaleBotService])
], BaleSchedulerService);
