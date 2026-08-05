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
exports.CollaborationController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const collaboration_service_1 = require("./collaboration.service");
let CollaborationController = class CollaborationController {
    constructor(svc) {
        this.svc = svc;
    }
    /** ثبت درخواست تسهیلگر */
    async registerFacilitator(req, body, file) {
        const userId = req?.user?.id || null;
        const resumeUrl = file ? `/uploads/resumes/${file.filename}` : null;
        return this.svc.registerFacilitator(userId, body, resumeUrl);
    }
    /** پروفایل من (تسهیلگر) */
    myProfile(req) {
        return this.svc.getMyFacilitatorProfile(req.user.id);
    }
    /** آپدیت پروفایل */
    updateProfile(req, body) {
        return this.svc.updateFacilitatorProfile(req.user.id, body);
    }
    /** آپدیت چک‌لیست */
    updateChecklist(req, body) {
        return this.svc.updateChecklist(req.user.id, body.item, body.done);
    }
    /** ادمین — لیست تسهیلگران */
    adminAll() {
        return this.svc.getAllFacilitators();
    }
    /** ادمین — تأیید */
    approve(id, body) {
        return this.svc.approveFacilitator(id, body.note);
    }
    /** ادمین — رد */
    reject(id, body) {
        return this.svc.rejectFacilitator(id, body.note);
    }
};
exports.CollaborationController = CollaborationController;
__decorate([
    (0, common_1.Post)('facilitator'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('resume', {
        storage: (0, multer_1.diskStorage)({
            destination: '/var/www/raavi/uploads/resumes',
            filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CollaborationController.prototype, "registerFacilitator", null);
__decorate([
    (0, common_1.Get)('facilitator/my-profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "myProfile", null);
__decorate([
    (0, common_1.Patch)('facilitator/my-profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)('facilitator/checklist'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "updateChecklist", null);
__decorate([
    (0, common_1.Get)('facilitator/admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "adminAll", null);
__decorate([
    (0, common_1.Patch)('facilitator/admin/approve/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)('facilitator/admin/reject/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "reject", null);
exports.CollaborationController = CollaborationController = __decorate([
    (0, common_1.Controller)('collaboration'),
    __metadata("design:paramtypes", [collaboration_service_1.CollaborationService])
], CollaborationController);
