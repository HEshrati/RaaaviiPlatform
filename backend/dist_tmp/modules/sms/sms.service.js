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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = exports.SmsTemplate = void 0;
/**
 * سرویس مرکزی SMS — استفاده از SMS.ir
 * API Key از متغیر محیطی OTP_API_KEY
 */
const common_1 = require("@nestjs/common");
var SmsTemplate;
(function (SmsTemplate) {
    SmsTemplate["OTP"] = "OTP_TEMPLATE_ID";
    SmsTemplate["BOOKING_CONFIRM"] = "BOOKING_CONFIRM_TEMPLATE_ID";
    SmsTemplate["LOCATION_REVEAL"] = "LOCATION_REVEAL_TEMPLATE_ID";
    SmsTemplate["MERGE"] = "MERGE_SMS_TEMPLATE_ID";
    SmsTemplate["BOOKING_REMINDER"] = "BOOKING_REMINDER_TEMPLATE_ID";
    SmsTemplate["LOCATION_CHANGE"] = "LOCATION_CHANGE_TEMPLATE_ID";
    SmsTemplate["TELEGRAM_INVITE"] = "TELEGRAM_INVITE_TEMPLATE_ID";
})(SmsTemplate || (exports.SmsTemplate = SmsTemplate = {}));
let SmsService = SmsService_1 = class SmsService {
    constructor() {
        this.logger = new common_1.Logger(SmsService_1.name);
        this.apiKey = process.env.OTP_API_KEY || '';
        this.isProd = process.env.NODE_ENV === 'production';
        this.baseUrl = 'https://api.sms.ir/v1';
        if (!this.apiKey && this.isProd)
            this.logger.error('⛔ OTP_API_KEY تنظیم نشده!');
    }
    async send(mobile, templateEnvKey, params) {
        const templateId = parseInt(process.env[templateEnvKey] || '100000');
        return this.sendWithTemplateId(mobile, templateId, params);
    }
    async sendWithTemplateId(mobile, templateId, params) {
        const m = this.normalizeMobile(mobile);
        if (!m)
            return { success: false, error: 'شماره نامعتبر' };
        if (!this.isProd || !this.apiKey) {
            this.logger.log(`[DEV SMS] → ${m} | tpl:${templateId} | ${params.map(p => `${p.name}=${p.value}`).join(', ')}`);
            return { success: true, messageId: `dev-${Date.now()}` };
        }
        try {
            const res = await fetch(`${this.baseUrl}/send/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
                body: JSON.stringify({ mobile: m, templateId, parameters: params }),
            });
            const data = await res.json();
            if (res.ok && data.status === 1) {
                this.logger.log(`✅ SMS → ${m}`);
                return { success: true, messageId: String(data.data?.messageId || '') };
            }
            this.logger.error(`❌ SMS → ${m}: ${data.message}`);
            return { success: false, error: data.message };
        }
        catch (e) {
            this.logger.error(`❌ Network SMS → ${m}:`, e.message);
            return { success: false, error: e.message };
        }
    }
    sendOtp(mobile, code) {
        return this.send(mobile, SmsTemplate.OTP, [{ name: 'Code', value: code }]);
    }
    sendBookingConfirm(mobile, name, eventTitle) {
        return this.send(mobile, SmsTemplate.BOOKING_CONFIRM, [
            { name: 'Name', value: name }, { name: 'EventTitle', value: eventTitle },
        ]);
    }
    sendLocationReveal(mobile, eventTitle, location, eventDate, siteUrl) {
        return this.send(mobile, SmsTemplate.LOCATION_REVEAL, [
            { name: 'EventTitle', value: eventTitle }, { name: 'Location', value: location },
            { name: 'EventDate', value: eventDate }, { name: 'SiteUrl', value: siteUrl },
        ]);
    }
    sendBookingReminder(mobile, name, link) {
        return this.send(mobile, SmsTemplate.BOOKING_REMINDER, [
            { name: 'Name', value: name }, { name: 'Link', value: link },
        ]);
    }
    sendMergeNotification(mobile, eventTitle, eventDate, eventTime, siteUrl) {
        return this.send(mobile, SmsTemplate.MERGE, [
            { name: 'EventTitle', value: eventTitle }, { name: 'EventDate', value: eventDate },
            { name: 'EventTime', value: eventTime }, { name: 'SiteUrl', value: siteUrl },
        ]);
    }
    sendTelegramInvite(mobile, eventTitle, telegramLink) {
        return this.send(mobile, SmsTemplate.TELEGRAM_INVITE, [
            { name: 'EventTitle', value: eventTitle }, { name: 'TelegramLink', value: telegramLink },
        ]);
    }
    async getCredit() {
        if (!this.apiKey)
            return 0;
        try {
            const r = await fetch(`${this.baseUrl}/credit`, { headers: { 'x-api-key': this.apiKey } });
            return (await r.json()).data?.credit || 0;
        }
        catch {
            return 0;
        }
    }
    async sendBulk(recipients, templateId, delayMs = 100) {
        const stats = { sent: 0, failed: 0 };
        for (const r of recipients) {
            const res = await this.sendWithTemplateId(r.mobile, templateId, r.params);
            res.success ? stats.sent++ : stats.failed++;
            if (delayMs > 0)
                await new Promise(x => setTimeout(x, delayMs));
        }
        this.logger.log(`��� Bulk: ${stats.sent} sent, ${stats.failed} failed`);
        return stats;
    }
    normalizeMobile(mobile) {
        if (!mobile)
            return null;
        let m = mobile.replace(/\D/g, '');
        if (m.startsWith('0098'))
            m = m.slice(2);
        if (m.startsWith('98') && m.length === 12)
            m = m.slice(2);
        if (m.startsWith('0') && m.length === 11)
            m = m.slice(1);
        return m.length === 10 && m.startsWith('9') ? m : null;
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SmsService);
