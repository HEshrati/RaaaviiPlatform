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
exports.HamravanController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const hamravan_service_1 = require("./hamravan.service");
let HamravanController = class HamravanController {
    constructor(svc) {
        this.svc = svc;
    }
    protocol() { return this.svc.getProtocol(); }
    getNeedsAssessment() {
        return this.svc.getNeedsAssessmentQuestions();
    }
    submitNeedsAssessment(req, body) {
        return this.svc.submitNeedsAssessment(req.user.id || req.user.userId, body.answers);
    }
    createSession(req, body) {
        return this.svc.createSession(req.user.id || req.user.userId, body);
    }
    psychologists(req, city, sessionId) {
        return this.svc.getSuggestedPsychologists(req.user.id || req.user.userId, city, sessionId);
    }
    slots(city, type) {
        return this.svc.getAvailableSlots(city, type);
    }
    bookSlot(req, body) {
        return this.svc.bookSlot(req.user.id || req.user.userId, body.slotId, body.dominantNeed);
    }
    complete(id, body) {
        return this.svc.completeSession(id, body.postData || {}, body.referralPath || 'self_help', body.notes || '');
    }
    mySessions(req) {
        return this.svc.getMySessions(req.user.id || req.user.userId);
    }
};
exports.HamravanController = HamravanController;
__decorate([
    (0, common_1.Get)('protocol'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HamravanController.prototype, "protocol", null);
__decorate([
    (0, common_1.Get)('needs-assessment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HamravanController.prototype, "getNeedsAssessment", null);
__decorate([
    (0, common_1.Post)('needs-assessment'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HamravanController.prototype, "submitNeedsAssessment", null);
__decorate([
    (0, common_1.Post)('session'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HamravanController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('psychologists'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], HamravanController.prototype, "psychologists", null);
__decorate([
    (0, common_1.Get)('slots'),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], HamravanController.prototype, "slots", null);
__decorate([
    (0, common_1.Post)('book-slot'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HamravanController.prototype, "bookSlot", null);
__decorate([
    (0, common_1.Post)('complete/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HamravanController.prototype, "complete", null);
__decorate([
    (0, common_1.Get)('my-sessions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HamravanController.prototype, "mySessions", null);
exports.HamravanController = HamravanController = __decorate([
    (0, common_1.Controller)('hamravan'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [hamravan_service_1.HamravanService])
], HamravanController);
