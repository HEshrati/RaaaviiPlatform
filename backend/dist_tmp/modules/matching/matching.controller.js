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
exports.MatchingController = void 0;
const common_1 = require("@nestjs/common");
const matching_service_1 = require("./matching.service");
let MatchingController = class MatchingController {
    constructor(matchingService) {
        this.matchingService = matchingService;
    }
    // اندپوینت ورود کاربر به صف مچینگ رویداد
    async joinQueue(eventId, req) {
        // فرض بر این است که شناسه کاربر از روی توکن (req.user.id) خوانده می‌شود.
        // برای تست دستی می‌توانید یک UUID ثابت جایگزین کنید.
        const userId = req.user?.id || '303a2b72-763d-4c38-9cb5-b467ec6b8017';
        return this.matchingService.joinQueue(eventId, userId);
    }
    // اندپوینت ادمین/کرون‌جاب برای تشکیل گروه‌ها
    async buildGroups(eventId) {
        return this.matchingService.executeMatchingEngine(eventId);
    }
    // وضعیت صف مچینگ رویداد
    async queueStatus(eventId) {
        return this.matchingService.getQueueStatus(eventId);
    }
};
exports.MatchingController = MatchingController;
__decorate([
    (0, common_1.Post)('match-queue/join'),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "joinQueue", null);
__decorate([
    (0, common_1.Post)('groups/build'),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "buildGroups", null);
__decorate([
    (0, common_1.Get)('match-queue/status'),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "queueStatus", null);
exports.MatchingController = MatchingController = __decorate([
    (0, common_1.Controller)('v1/events/:eventId'),
    __metadata("design:paramtypes", [matching_service_1.MatchingService])
], MatchingController);
