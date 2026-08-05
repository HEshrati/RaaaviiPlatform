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
var BaleBotController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaleBotController = void 0;
const common_1 = require("@nestjs/common");
const bale_bot_service_1 = require("./bale-bot.service");
let BaleBotController = BaleBotController_1 = class BaleBotController {
    constructor(svc) {
        this.svc = svc;
        this.logger = new common_1.Logger(BaleBotController_1.name);
        this.secret = process.env.BALE_BOT_WEBHOOK_SECRET || '';
    }
    async webhook(s, update) {
        if (s !== this.secret)
            return { ok: false, error: 'invalid secret' };
        await this.svc.handleUpdate(update);
        return { ok: true };
    }
    async notifyGroups(body) {
        await this.svc.notifyGroups(body.eventId, body.groups);
        return { ok: true };
    }
    async notifyAdmin(body) {
        await this.svc.notifyAdmin(body.message);
        return { ok: true };
    }
    async sendEventReminder(body) {
        const sent = await this.svc.sendEventReminder(body.phone, body.booking);
        return { ok: true, sent };
    }
    async sendReceipt(body) {
        const sent = await this.svc.sendPaymentReceipt(body.phone, body.payment);
        return { ok: true, sent };
    }
    async sendRecs(body) {
        const results = {};
        if (body.events?.length)
            results.events = await this.svc.sendEventRecommendations(body.phone, body.events);
        if (body.therapists?.length)
            results.therapists = await this.svc.sendPsychologistRecommendations(body.phone, body.therapists);
        return { ok: true, ...results };
    }
    async sendOtp(body) {
        return this.svc.sendOtp(body.phone, body.code);
    }
    /** ساخت deep link برای اتصال بله */
    async generateLink(phone) {
        if (!phone)
            return { error: 'phone required' };
        const clean = phone.replace(/[^0-9]/g, '');
        const botUsername = process.env.BALE_BOT_USERNAME || 'raaviiplatformbot';
        const param = 'otp_' + clean + '_' + Date.now();
        const deepLink = 'https://ble.ir/' + botUsername + '?start=' + param;
        return { deepLink, param };
    }
    async testSend(phone, code) {
        return this.svc.sendOtp(phone, code || '12345');
    }
    async info() { return this.svc.getWebhookInfo(); }
    async setWebhook(url) { return this.svc.setWebhook(url); }
};
exports.BaleBotController = BaleBotController;
__decorate([
    (0, common_1.Post)('webhook/:secret'),
    __param(0, (0, common_1.Param)('secret')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "webhook", null);
__decorate([
    (0, common_1.Post)('notify-groups'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "notifyGroups", null);
__decorate([
    (0, common_1.Post)('notify-admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "notifyAdmin", null);
__decorate([
    (0, common_1.Post)('send-event-reminder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "sendEventReminder", null);
__decorate([
    (0, common_1.Post)('send-payment-receipt'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "sendReceipt", null);
__decorate([
    (0, common_1.Post)('send-recommendations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "sendRecs", null);
__decorate([
    (0, common_1.Post)('send-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Get)('generate-link'),
    __param(0, (0, common_1.Query)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "generateLink", null);
__decorate([
    (0, common_1.Get)('test-send'),
    __param(0, (0, common_1.Query)('phone')),
    __param(1, (0, common_1.Query)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "testSend", null);
__decorate([
    (0, common_1.Get)('webhook-info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "info", null);
__decorate([
    (0, common_1.Post)('set-webhook'),
    __param(0, (0, common_1.Body)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BaleBotController.prototype, "setWebhook", null);
exports.BaleBotController = BaleBotController = BaleBotController_1 = __decorate([
    (0, common_1.Controller)('bale'),
    __metadata("design:paramtypes", [bale_bot_service_1.BaleBotService])
], BaleBotController);
