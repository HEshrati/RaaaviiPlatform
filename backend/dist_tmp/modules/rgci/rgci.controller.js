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
exports.RgciController = void 0;
const common_1 = require("@nestjs/common");
const rgci_service_1 = require("./rgci.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let RgciController = class RgciController {
    constructor(rgciService) {
        this.rgciService = rgciService;
    }
    // دریافت سوالات RGCI
    getQuestions() {
        return { questions: rgci_service_1.RGCI_QUESTIONS };
    }
    // ثبت پاسخ‌های RGCI
    async submitRgci(req, body) {
        return this.rgciService.submitRgci(req.user.id, body.event_id || null, body.responses);
    }
    // دریافت نمره RGCI کاربر
    async getMyScore(req, eventId) {
        return this.rgciService.getMyRgci(req.user.id, eventId);
    }
    // ثبت پرسشنامه پس از رویداد
    async submitPostEvent(req, body) {
        return this.rgciService.submitPostEventSurvey(req.user.id, body.event_id, body.group_id || null, body.responses);
    }
    // ثبت پیامدهای روانشناختی
    async submitOutcome(req, body) {
        return this.rgciService.submitOutcome(req.user.id, body.event_id || null, body.stage, body.responses);
    }
    // پیشنهاد مقاله بر اساس نیاز روانشناختی
    async getArticleRecommendations(req) {
        return this.rgciService.getArticleRecommendations(req.user.id);
    }
    // آمار کامل کاربر
    async getMyStats(req) {
        return this.rgciService.getMyStats(req.user.id);
    }
    // پروفایل کامل RGCI با فرمت استاندارد PDF (فاز ۲)
    async getRgciProfile(userId) {
        return this.rgciService.getFullRgciProfile(userId);
    }
};
exports.RgciController = RgciController;
__decorate([
    (0, common_1.Get)('questions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RgciController.prototype, "getQuestions", null);
__decorate([
    (0, common_1.Post)('submit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RgciController.prototype, "submitRgci", null);
__decorate([
    (0, common_1.Get)('my-score'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('event_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RgciController.prototype, "getMyScore", null);
__decorate([
    (0, common_1.Post)('post-event'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RgciController.prototype, "submitPostEvent", null);
__decorate([
    (0, common_1.Post)('outcome'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RgciController.prototype, "submitOutcome", null);
__decorate([
    (0, common_1.Get)('article-recommendations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RgciController.prototype, "getArticleRecommendations", null);
__decorate([
    (0, common_1.Get)('my-stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RgciController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Get)('users/:userId/profile'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RgciController.prototype, "getRgciProfile", null);
exports.RgciController = RgciController = __decorate([
    (0, common_1.Controller)('rgci'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [rgci_service_1.RgciService])
], RgciController);
