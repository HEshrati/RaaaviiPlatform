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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const events_controller_1 = require("../events/events.controller");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    /**
     * ادمین: لیست حضور و غیاب یک رویداد
     */
    async getAttendanceList(eventId, req) {
        if (!(0, events_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('فقط ادمین‌ها دسترسی دارند');
        return this.attendanceService.getAttendanceList(eventId);
    }
    /**
     * ادمین: ثبت حضور یا غیاب یک نفر
     */
    async markAttendance(eventId, body, req) {
        if (!(0, events_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('فقط ادمین‌ها دسترسی دارند');
        return this.attendanceService.markAttendance(eventId, body.userId, body.attended, req.user.id);
    }
    /**
     * ادمین: ثبت حضور و غیاب دسته‌ای
     */
    async bulkMarkAttendance(eventId, body, req) {
        if (!(0, events_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('فقط ادمین‌ها دسترسی دارند');
        return this.attendanceService.bulkMarkAttendance(eventId, body.attendances, req.user.id);
    }
    /**
     * ادمین: درخواست دستی ارسال رتینگ بعد از رویداد
     */
    async triggerRating(eventId, req) {
        if (!(0, events_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('فقط ادمین‌ها دسترسی دارند');
        return this.attendanceService.triggerRatingRequest(eventId);
    }
    /**
     * کاربر: ارسال رتینگ به شرکت‌کنندگان همنشینی
     */
    async submitRating(eventId, body, req) {
        return this.attendanceService.submitRating(eventId, req.user.id, body.ratings);
    }
    /**
     * کاربر: بررسی وضعیت رتینگ (آیا باید popup نشون داده بشه)
     */
    async getRatingStatus(eventId, req) {
        return this.attendanceService.getRatingStatus(eventId, req.user.id);
    }
    /**
     * ادمین: داشبورد آمار حضور
     */
    async getAdminDashboard(req) {
        if (!(0, events_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('فقط ادمین‌ها دسترسی دارند');
        return this.attendanceService.getAdminAttendanceDashboard(req.user.id);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Get)('event/:eventId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAttendanceList", null);
__decorate([
    (0, common_1.Post)('event/:eventId/mark'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "markAttendance", null);
__decorate([
    (0, common_1.Post)('event/:eventId/bulk-mark'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "bulkMarkAttendance", null);
__decorate([
    (0, common_1.Post)('event/:eventId/trigger-rating'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "triggerRating", null);
__decorate([
    (0, common_1.Post)('event/:eventId/rate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "submitRating", null);
__decorate([
    (0, common_1.Get)('event/:eventId/rating-status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getRatingStatus", null);
__decorate([
    (0, common_1.Get)('admin/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAdminDashboard", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
