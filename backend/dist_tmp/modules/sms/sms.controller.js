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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsController = void 0;
const common_1 = require("@nestjs/common");
const sms_service_1 = require("./sms.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const isAdmin = (u) => u?.role === 'admin' || u?.isAdmin;
let SmsController = class SmsController {
    constructor(sms) {
        this.sms = sms;
    }
    async credit(req) {
        if (!isAdmin(req.user))
            throw new common_1.ForbiddenException();
        return { credit: await this.sms.getCredit() };
    }
    async test(body, req) {
        if (!isAdmin(req.user))
            throw new common_1.ForbiddenException();
        return this.sms.sendOtp(body.mobile, '123456');
    }
    async reminder(body, req) {
        if (!isAdmin(req.user))
            throw new common_1.ForbiddenException();
        const link = body.link || `${process.env.FRONTEND_URL}/events`;
        return this.sms.sendBookingReminder(body.mobile, body.name, link);
    }
};
exports.SmsController = SmsController;
__decorate([
    (0, common_1.Get)('credit'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "credit", null);
__decorate([
    (0, common_1.Post)('test'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "test", null);
__decorate([
    (0, common_1.Post)('send-reminder'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "reminder", null);
exports.SmsController = SmsController = __decorate([
    (0, common_1.Controller)('sms'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sms_service_1.SmsService])
], SmsController);
