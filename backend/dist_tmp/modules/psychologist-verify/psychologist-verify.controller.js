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
exports.PsychologistVerifyController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const psychologist_verify_service_1 = require("./psychologist-verify.service");
const imageFileFilter = (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return cb(new common_1.BadRequestException('فقط فایل تصویری (jpg, png, webp) مجاز است'), false);
    }
    cb(null, true);
};
const docFileFilter = (req, file, cb) => {
    if (!file.mimetype.match(/(jpg|jpeg|png|pdf)$/i)) {
        return cb(new common_1.BadRequestException('فقط فایل تصویری یا PDF مجاز است'), false);
    }
    cb(null, true);
};
let PsychologistVerifyController = class PsychologistVerifyController {
    constructor(service) {
        this.service = service;
    }
    // ── احراز هویت / تکمیل پروفایل ────────────────────────────────
    async verifyLicense(req, body) {
        return this.service.verifyLicense(req.user.id, body.licenseNumber, body.mobileNumber);
    }
    async completeProfile(req, body) {
        return this.service.completeProfile(req.user.id, body);
    }
    async getStatus(req) {
        return this.service.getVerificationStatus(req.user.id);
    }
    // ── آپلود مدارک تحصیلی/مجوز ────────────────────────────────────
    async uploadCredential(req, file) {
        if (!file)
            throw new common_1.BadRequestException('فایلی ارسال نشده است');
        return this.service.saveCredentialDocument(req.user.id, file);
    }
    // ── آپلود تصاویر فضا (Venue) ────────────────────────────────────
    async uploadVenueImages(req, venueId, files) {
        if (!files?.length)
            throw new common_1.BadRequestException('هیچ فایلی ارسال نشده است');
        return this.service.saveVenueImages(req.user.id, venueId, files);
    }
    // ── اسلات‌ها و رزرو ──────────────────────────────────────────────
    async setAvailability(req, body) {
        return this.service.setAvailability(req.user.id, body);
    }
    async getSlots(psychologistUserId, city) {
        return this.service.getAvailableSlots(psychologistUserId, city);
    }
    async bookSlot(req, slotId, body) {
        return this.service.bookSlot(req.user.id, slotId, body.userNeed, body.notes);
    }
    async getMySlots(req, from, to) {
        return this.service.getMySlots(req.user.id, from, to);
    }
    async getMyBookings(req) {
        return this.service.getMyBookings(req.user.id);
    }
    async getMyBookingById(req, bookingId) {
        return this.service.getMyBookingById(req.user.id, bookingId);
    }
    async updateBookingStatus(req, bookingId, body) {
        return this.service.updateBookingStatus(req.user.id, bookingId, body.status);
    }
    // ── داشبورد روانشناس ─────────────────────────────────────────────
    async getDashboard(req) {
        return this.service.getDashboardStats(req.user.id);
    }
    async getMyProfile(req) {
        return this.service.getMyProfile(req.user.id);
    }
    async updateMyProfile(req, body) {
        return this.service.updateMyProfile(req.user.id, body);
    }
    async getMyPatients(req) {
        return this.service.getMyPatients(req.user.id);
    }
    async getPatientTests(req, patientUserId) {
        return this.service.getPatientTests(req.user.id, patientUserId);
    }
    // ── فرم مصاحبه بالینی ─────────────────────────────────────────────
    // ⚠️ توجه: منطق تشخیص ریسک در این فرم (مثلاً اینکه چه پاسخی high-risk
    // محسوب می‌شود) باید پیش از انتشار نهایی توسط یک متخصص بالینی بازبینی شود.
    async createInterview(req, body) {
        return this.service.createInterview(req.user.id, body);
    }
    async saveInterviewSection(req, interviewId, body) {
        return this.service.saveInterviewSection(req.user.id, interviewId, body);
    }
    async submitInterview(req, interviewId, body) {
        return this.service.submitInterview(req.user.id, interviewId, body.clinicalNote);
    }
    async getMyInterviews(req) {
        return this.service.getMyInterviews(req.user.id);
    }
    // ── ادمین ────────────────────────────────────────────────────────
    async getPendingForAdmin() {
        return this.service.getPendingForAdmin();
    }
    async approve(req, licenseNumber, body) {
        return this.service.approveByAdmin(licenseNumber, req.user.id, body.adminNote);
    }
    async reject(req, licenseNumber, body) {
        return this.service.rejectByAdmin(licenseNumber, req.user.id, body.reason);
    }
    async requestRevision(req, licenseNumber, body) {
        return this.service.requestRevision(licenseNumber, req.user.id, body.reason);
    }
    // ── لیست سیاه (ادمین) ───────────────────────────────────────────
    async getBlacklist() {
        return this.service.getBlacklist();
    }
    async addToBlacklist(req, body) {
        return this.service.addToBlacklist(req.user.id, body.mobile, body.reason || '');
    }
    async removeFromBlacklist(req, body) {
        return this.service.removeFromBlacklist(req.user.id, body.mobile);
    }
    // ── Audit Log (ادمین) ───────────────────────────────────────────
    async getAuditLogs(targetType, targetId, limit) {
        return this.service.getAuditLogs(targetType, targetId, limit ? parseInt(limit, 10) : 100);
    }
};
exports.PsychologistVerifyController = PsychologistVerifyController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('license'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "verifyLicense", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('complete-profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "completeProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('credentials/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: '/var/www/raavi/backend/uploads/credentials',
            filename: (req, file, cb) => {
                const unique = `${req.user.id}-${Date.now()}${(0, path_1.extname)(file.originalname)}`;
                cb(null, unique);
            },
        }),
        fileFilter: docFileFilter,
        limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "uploadCredential", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('venues/:venueId/images'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 6, {
        storage: (0, multer_1.diskStorage)({
            destination: '/var/www/raavi/backend/uploads/venues',
            filename: (req, file, cb) => {
                const unique = `${req.params.venueId}-${Date.now()}-${Math.round(Math.random() * 1e6)}${(0, path_1.extname)(file.originalname)}`;
                cb(null, unique);
            },
        }),
        fileFilter: imageFileFilter,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB هر فایل
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('venueId')),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "uploadVenueImages", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('availability'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "setAvailability", null);
__decorate([
    (0, common_1.Get)('slots'),
    __param(0, (0, common_1.Query)('psychologistUserId')),
    __param(1, (0, common_1.Query)('city')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getSlots", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('slots/:slotId/book'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('slotId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "bookSlot", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my-slots'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getMySlots", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my-bookings'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getMyBookings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my-bookings/:bookingId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getMyBookingById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('bookings/:bookingId/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "updateBookingStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('patients'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getMyPatients", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('patients/:patientUserId/tests'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('patientUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getPatientTests", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('interviews'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "createInterview", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('interviews/:interviewId/sections'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('interviewId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "saveInterviewSection", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('interviews/:interviewId/submit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('interviewId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "submitInterview", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('interviews'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getMyInterviews", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('admin/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getPendingForAdmin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Patch)('admin/:licenseNumber/approve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('licenseNumber')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "approve", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Patch)('admin/:licenseNumber/reject'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('licenseNumber')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "reject", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Patch)('admin/:licenseNumber/request-revision'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('licenseNumber')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "requestRevision", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('admin/blacklist'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getBlacklist", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)('admin/blacklist'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "addToBlacklist", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)('admin/blacklist/remove'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "removeFromBlacklist", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('admin/audit-logs'),
    __param(0, (0, common_1.Query)('targetType')),
    __param(1, (0, common_1.Query)('targetId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PsychologistVerifyController.prototype, "getAuditLogs", null);
exports.PsychologistVerifyController = PsychologistVerifyController = __decorate([
    (0, common_1.Controller)('api/psychologist-verify'),
    __metadata("design:paramtypes", [psychologist_verify_service_1.PsychologistVerifyService])
], PsychologistVerifyController);
