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
exports.JourneyController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const journey_service_1 = require("./journey.service");
let JourneyController = class JourneyController {
    constructor(svc) {
        this.svc = svc;
    }
    myJourney(req) {
        return this.svc.getMyJourney(req.user.id || req.user.userId);
    }
    trackEvent(req, body) {
        return this.svc.trackEvent(req.user.id || req.user.userId, body.eventType, body.metadata);
    }
    updateState(req, body) {
        return this.svc.updateState(req.user.id || req.user.userId, body.phase, body.data);
    }
};
exports.JourneyController = JourneyController;
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "myJourney", null);
__decorate([
    (0, common_1.Post)('event'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "trackEvent", null);
__decorate([
    (0, common_1.Post)('state'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], JourneyController.prototype, "updateState", null);
exports.JourneyController = JourneyController = __decorate([
    (0, common_1.Controller)('journey'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [journey_service_1.JourneyService])
], JourneyController);
