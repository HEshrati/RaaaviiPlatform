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
exports.IntelligenceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const intelligence_service_1 = require("./intelligence.service");
const recommendation_engine_service_1 = require("./recommendation-engine.service");
let IntelligenceController = class IntelligenceController {
    constructor(svc, engine) {
        this.svc = svc;
        this.engine = engine;
    }
    async myProfile(req) {
        return this.svc.getFullProfile(req.user.userId || req.user.id || req.user.sub);
    }
    async articleRecs(req) {
        return this.svc.getArticleRecommendations(req.user.userId || req.user.id || req.user.sub);
    }
    async eventRecs(req) {
        return this.svc.getEventRecommendations(req.user.userId || req.user.id || req.user.sub);
    }
    async nextTests(req) {
        return this.svc.getNextRecommendedTests(req.user.userId || req.user.id || req.user.sub);
    }
    async sync(req) {
        await this.svc.fullSync(req.user.userId || req.user.id || req.user.sub);
        return { success: true };
    }
    async phases(req) {
        const p = await this.svc.getFullProfile(req.user.userId || req.user.id || req.user.sub);
        return p.phases;
    }
    async myRecs(req) {
        const uid = req.user?.userId || req.user?.id || req.user?.sub;
        return this.engine.getUserRecommendations(uid);
    }
    async triggerEvent(id) {
        await this.engine.onNewEvent(id);
        return { success: true };
    }
};
exports.IntelligenceController = IntelligenceController;
__decorate([
    (0, common_1.Get)('my-profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntelligenceController.prototype, "myProfile", null);
__decorate([
    (0, common_1.Get)('article-recs'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntelligenceController.prototype, "articleRecs", null);
__decorate([
    (0, common_1.Get)('event-recs'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntelligenceController.prototype, "eventRecs", null);
__decorate([
    (0, common_1.Get)('next-tests'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntelligenceController.prototype, "nextTests", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntelligenceController.prototype, "sync", null);
__decorate([
    (0, common_1.Get)('phases'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntelligenceController.prototype, "phases", null);
__decorate([
    (0, common_1.Get)('my-recommendations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntelligenceController.prototype, "myRecs", null);
__decorate([
    (0, common_1.Post)('trigger-event/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IntelligenceController.prototype, "triggerEvent", null);
exports.IntelligenceController = IntelligenceController = __decorate([
    (0, common_1.Controller)('intelligence'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [intelligence_service_1.IntelligenceService,
        recommendation_engine_service_1.RecommendationEngineService])
], IntelligenceController);
