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
var BaleGroupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaleGroupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
let BaleGroupService = BaleGroupService_1 = class BaleGroupService {
    constructor(ds) {
        this.ds = ds;
        this.logger = new common_1.Logger(BaleGroupService_1.name);
        this.token = process.env.BALE_BOT_TOKEN || '';
        this.apiUrl = process.env.BALE_BOT_API_URL || 'https://tapi.bale.ai';
        this.siteUrl = 'https://raaviiplatform.com';
    }
    get api() { return `${this.apiUrl}/bot${this.token}`; }
    /** ثبت‌نام کاربر برای دریافت لینک گروه بله */
    async registerForGroup(eventId, userId, phone, chatId) {
        const normPhone = this.normalizePhone(phone);
        await this.ds.query(`
      INSERT INTO event_bale_registrations (event_id, user_id, phone, chat_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (event_id, phone) DO UPDATE SET chat_id=$4, registered_at=NOW()
    `, [eventId, userId, normPhone, String(chatId)]);
        // پیام تأیید
        await this.sendMessage(chatId, `✅ *ثبت‌نام گروه بله رویداد*\n\n` +
            `شما برای دریافت لینک گروه بله این رویداد ثبت‌نام شدید.\n\n` +
            `📌 پس از برگزاری رویداد و تکمیل گروه‌بندی، لینک گروه برای شما ارسال خواهد شد.\n\n` +
            `⏰ صبور باشید — گروه‌بندی پس از پایان رویداد انجام می‌شود.`);
    }
    /** ادمین — ست کردن لینک گروه برای رویداد */
    async setGroupLink(eventId, groupLink) {
        await this.ds.query('UPDATE events SET bale_group_link=$1 WHERE id=$2', [groupLink, eventId]);
    }
    /** ارسال لینک گروه به همه ثبت‌نام‌شدگان */
    async sendGroupLinkToRegistered(eventId) {
        const event = await this.ds.query('SELECT title, bale_group_link FROM events WHERE id=$1', [eventId]);
        if (!event?.[0]?.bale_group_link)
            return 0;
        const { title, bale_group_link } = event[0];
        const regs = await this.ds.query(`
      SELECT r.chat_id, r.phone
      FROM event_bale_registrations r
      WHERE r.event_id=$1 AND r.notified_at IS NULL
    `, [eventId]);
        let sent = 0;
        for (const reg of regs) {
            const ok = await this.sendMessage(BigInt(reg.chat_id), `🎉 *گروه رویداد شما آماده شد!*\n\n` +
                `*${title}*\n\n` +
                `🔗 لینک گروه بله:\n${bale_group_link}\n\n` +
                `📌 این لینک اختصاصی گروه شماست. لطفاً با دیگران به اشتراک نگذارید.`);
            if (ok) {
                await this.ds.query('UPDATE event_bale_registrations SET notified_at=NOW() WHERE event_id=$1 AND phone=$2', [eventId, reg.phone]);
                sent++;
            }
            await new Promise(r => setTimeout(r, 300));
        }
        if (sent > 0) {
            await this.ds.query('UPDATE events SET bale_group_sent_at=NOW() WHERE id=$1', [eventId]);
        }
        return sent;
    }
    /** Cron — هر ۳۰ دقیقه: چک رویدادهای تموم‌شده با گروه ست‌شده */
    async autoSendGroupLinks() {
        const events = await this.ds.query(`
      SELECT id, title FROM events
      WHERE end_date < NOW()
        AND bale_group_link IS NOT NULL
        AND bale_group_sent_at IS NULL
        AND EXISTS (
          SELECT 1 FROM event_bale_registrations 
          WHERE event_id=events.id AND notified_at IS NULL
        )
    `);
        for (const ev of events) {
            const sent = await this.sendGroupLinkToRegistered(ev.id);
            if (sent > 0) {
                this.logger.log(`✅ گروه بله رویداد "${ev.title}" به ${sent} نفر ارسال شد`);
            }
        }
    }
    /** اطلاعات ثبت‌نام‌شدگان هر رویداد */
    async getRegistrations(eventId) {
        return this.ds.query(`
      SELECT r.phone, r.registered_at, r.notified_at,
             u.name, b.status as booking_status
      FROM event_bale_registrations r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN bookings b ON b.event_id=r.event_id AND b.user_id=r.user_id
      WHERE r.event_id=$1
      ORDER BY r.registered_at DESC
    `, [eventId]);
    }
    normalizePhone(p) {
        p = String(p).replace(/\D/g, '');
        if (p.startsWith('98'))
            return p;
        if (p.startsWith('0'))
            return '98' + p.substring(1);
        if (p.startsWith('9') && p.length === 10)
            return '98' + p;
        return p;
    }
    async sendMessage(chatId, text) {
        try {
            const r = await fetch(`${this.api}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: String(chatId), text, parse_mode: 'Markdown' }),
            });
            const d = await r.json();
            return !!d.ok;
        }
        catch {
            return false;
        }
    }
};
exports.BaleGroupService = BaleGroupService;
__decorate([
    (0, schedule_1.Cron)('0 */30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BaleGroupService.prototype, "autoSendGroupLinks", null);
exports.BaleGroupService = BaleGroupService = BaleGroupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], BaleGroupService);
