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
exports.FacilitatorController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const facilitator_service_1 = require("./facilitator.service");
let FacilitatorController = class FacilitatorController {
    constructor(svc) {
        this.svc = svc;
    }
    domains() { return this.svc.getDomains(); }
    register(req, body) {
        return this.svc.registerProfile(req.user.id || req.user.userId, body);
    }
    acceptManifesto(req) {
        return this.svc.acceptManifesto(req.user.id || req.user.userId);
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
    adminAll(status) { return this.svc.getAllForAdmin(status); }
    adminApprove(id, body) {
        return this.svc.approveByAdmin(id, body.note);
    }
    adminReject(id, body) {
        return this.svc.rejectByAdmin(id, body.reason);
    }
};
exports.FacilitatorController = FacilitatorController;
__decorate([
    (0, common_1.Get)('domains'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FacilitatorController.prototype, "domains", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FacilitatorController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('accept-manifesto'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FacilitatorController.prototype, "acceptManifesto", null);
__decorate([
    (0, common_1.Get)('my-profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FacilitatorController.prototype, "myProfile", null);
__decorate([
    (0, common_1.Patch)('my-profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FacilitatorController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FacilitatorController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FacilitatorController.prototype, "adminAll", null);
__decorate([
    (0, common_1.Post)('admin/approve/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FacilitatorController.prototype, "adminApprove", null);
__decorate([
    (0, common_1.Post)('admin/reject/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FacilitatorController.prototype, "adminReject", null);
exports.FacilitatorController = FacilitatorController = __decorate([
    (0, common_1.Controller)('facilitator'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [facilitator_service_1.FacilitatorService])
], FacilitatorController);
