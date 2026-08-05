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
exports.RoiController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roi_service_1 = require("./roi.service");
const user_entity_1 = require("../users/entities/user.entity");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
function isAdmin(u) { return u?.role === 'admin' || u?.isAdmin; }
let RoiController = class RoiController {
    constructor(roiService, userRepo, spRepo) {
        this.roiService = roiService;
        this.userRepo = userRepo;
        this.spRepo = spRepo;
    }
    getEventROI(id, req) {
        if (!isAdmin(req.user))
            throw new common_1.ForbiddenException();
        return this.roiService.getEventROI(id);
    }
    getMonthly(m, req) {
        if (!isAdmin(req.user))
            throw new common_1.ForbiddenException();
        return this.roiService.getMonthlyROI(Number(m) || 3);
    }
    getDashboard(m, req) {
        if (!isAdmin(req.user))
            throw new common_1.ForbiddenException();
        return this.roiService.getMonthlyROI(Number(m) || 3);
    }
    async analyze(id, req) {
        if (!isAdmin(req.user))
            throw new common_1.ForbiddenException();
        const result = await this.roiService.analyzeEventWithAI(id);
        const banned = [];
        for (const uid of result.bannedUsers) {
            const user = await this.userRepo.findOne({ where: { id: uid } });
            if (user && !user.isBanned) {
                user.isBanned = true;
                user.banReason = 'غیبت بیش از ۲ بار';
                await this.userRepo.save(user);
                const sp = await this.spRepo.findOne({ where: { user_id: uid } });
                if (sp) {
                    sp.is_suspended = true;
                    sp.suspension_reason = 'غیبت بیش از ۲ بار';
                    sp.suspended_at = new Date();
                    await this.spRepo.save(sp);
                }
                banned.push(user.name || user.mobileNumber || uid);
            }
        }
        return { ...result, autoBanned: banned, bannedCount: banned.length };
    }
};
exports.RoiController = RoiController;
__decorate([
    (0, common_1.Get)('event/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoiController.prototype, "getEventROI", null);
__decorate([
    (0, common_1.Get)('monthly'),
    __param(0, (0, common_1.Query)('months')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoiController.prototype, "getMonthly", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Query)('months')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoiController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('analyze/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoiController.prototype, "analyze", null);
exports.RoiController = RoiController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('roi'),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(smart_profile_entity_1.SmartProfile)),
    __metadata("design:paramtypes", [roi_service_1.RoiService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RoiController);
