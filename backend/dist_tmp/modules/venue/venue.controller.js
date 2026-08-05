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
exports.VenueController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const venue_service_1 = require("./venue.service");
let VenueController = class VenueController {
    constructor(svc) {
        this.svc = svc;
    }
    options() { return this.svc.getOptions(); }
    register(req, body) {
        return this.svc.registerVenue(req.user.id || req.user.userId, body);
    }
    acceptTerms(req) {
        return this.svc.acceptTerms(req.user.id || req.user.userId);
    }
    myProfile(req) {
        return this.svc.getMyProfile(req.user.id || req.user.userId);
    }
    updateProfile(req, body) {
        return this.svc.updateMyProfile(req.user.id || req.user.userId, body);
    }
    status(req) {
        return this.svc.getStatus(req.user.id || req.user.userId);
    }
    myEvents(req) {
        return this.svc.getVenueEvents(req.user.id || req.user.userId);
    }
    adminAll(status) { return this.svc.getAllForAdmin(status); }
    adminApprove(id, body) {
        return this.svc.approveByAdmin(id, body.note);
    }
    adminReject(id, body) {
        return this.svc.rejectByAdmin(id, body.reason);
    }
};
exports.VenueController = VenueController;
__decorate([
    (0, common_1.Get)('options'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VenueController.prototype, "options", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], VenueController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('accept-terms'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VenueController.prototype, "acceptTerms", null);
__decorate([
    (0, common_1.Get)('my-profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VenueController.prototype, "myProfile", null);
__decorate([
    (0, common_1.Patch)('my-profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], VenueController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VenueController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('my-events'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VenueController.prototype, "myEvents", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VenueController.prototype, "adminAll", null);
__decorate([
    (0, common_1.Post)('admin/approve/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VenueController.prototype, "adminApprove", null);
__decorate([
    (0, common_1.Post)('admin/reject/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VenueController.prototype, "adminReject", null);
exports.VenueController = VenueController = __decorate([
    (0, common_1.Controller)('venue'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [venue_service_1.VenueService])
], VenueController);
