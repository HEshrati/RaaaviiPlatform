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
var MatchingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const matching_service_1 = require("./matching.service");
const admin_controller_1 = require("../admin/admin.controller");
let MatchingController = MatchingController_1 = class MatchingController {
    constructor(smartProfileRepo, bookingRepo, matchingService) {
        this.smartProfileRepo = smartProfileRepo;
        this.bookingRepo = bookingRepo;
        this.matchingService = matchingService;
        this.logger = new common_1.Logger(MatchingController_1.name);
    }
    async suspendUserManually(userId, body, req) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('دسترسی ادمین لازم است');
        let profile = await this.smartProfileRepo.findOne({ where: { user_id: userId } });
        if (!profile)
            profile = this.smartProfileRepo.create({ user_id: userId });
        profile.is_suspended = true;
        profile.suspension_reason = body.reason || 'ساسپند توسط ادمین';
        profile.suspended_at = new Date();
        await this.smartProfileRepo.save(profile);
        this.logger.log(`User ${userId} manually suspended by admin`);
        return { success: true, userId, suspended: true };
    }
    async mergeIncompleteGroups(eventId, req) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException();
        const bookings = await this.bookingRepo.find({
            where: { event_id: eventId, status: 'confirmed' },
        });
        if (bookings.length < 2)
            return { success: false, message: 'کاربران کافی نیست' };
        const userIds = bookings.map((b) => b.user_id).filter(Boolean);
        const groups = await this.matchingService.createSmartGroups(eventId, userIds, 5, 'mixed');
        return {
            success: true, eventId,
            totalGroups: groups.length,
            merged: groups.length < userIds.length / 3,
            groups,
        };
    }
};
exports.MatchingController = MatchingController;
__decorate([
    (0, common_1.Post)('suspend/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "suspendUserManually", null);
__decorate([
    (0, common_1.Post)('merge-incomplete-groups/:eventId'),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MatchingController.prototype, "mergeIncompleteGroups", null);
exports.MatchingController = MatchingController = MatchingController_1 = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('matching'),
    __param(0, (0, typeorm_1.InjectRepository)(smart_profile_entity_1.SmartProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        matching_service_1.MatchingService])
], MatchingController);
