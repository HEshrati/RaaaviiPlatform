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
exports.CrmController = void 0;
/**
 * CrmController — API endpoints برای داشبورد ادمین
 * مسیر: src/modules/crm/crm.controller.ts
 */
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const crm_service_1 = require("./crm.service");
const user_behavior_event_entity_1 = require("./entities/user-behavior-event.entity");
const crm_ai_alert_entity_1 = require("./entities/crm-ai-alert.entity");
const admin_controller_1 = require("../admin/admin.controller");
let CrmController = class CrmController {
    constructor(crm) {
        this.crm = crm;
    }
    // ── فقط ادمین ──────────────────────────────────────────────────
    requireAdmin(req) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('دسترسی ادمین لازم است');
    }
    // ── ۱. آمار کلی داشبورد ────────────────────────────────────────
    async getDashboard(req, days = '7') {
        this.requireAdmin(req);
        return this.crm.getDashboardStats(Number(days));
    }
    // ── ۲. لیست هشدارها ────────────────────────────────────────────
    async getAlerts(req, status, page = '1', limit = '20') {
        this.requireAdmin(req);
        return this.crm.getAlerts(status, Number(page), Number(limit));
    }
    // ── ۳. بروزرسانی وضعیت هشدار ───────────────────────────────────
    async updateAlert(req, id, body) {
        this.requireAdmin(req);
        return this.crm.updateAlertStatus(id, body.status, req.user.id, body.note);
    }
    // ── ۴. trigger تحلیل AI دستی ──────────────────────────────────
    async triggerAnalysis(req, body) {
        this.requireAdmin(req);
        const alert = await this.crm.triggerManualAnalysis(body.hours ?? 24);
        return {
            success: true,
            alert,
            message: alert ? `هشدار جدید: ${alert.title}` : 'وضعیت سیستم نرمال است ✅',
        };
    }
    // ── ۵. کاربران در خطر ریزش ─────────────────────────────────────
    async getChurnRisk(req) {
        this.requireAdmin(req);
        return this.crm.getChurnRiskUsers();
    }
    // ── ۶. رفتار یک کاربر خاص ──────────────────────────────────────
    async getUserSummary(req, userId, days = '30') {
        this.requireAdmin(req);
        return this.crm.getUserBehaviorSummary(userId, Number(days));
    }
    async getUserEvents(req, userId, page = '1') {
        this.requireAdmin(req);
        return this.crm.getUserEvents(userId, Number(page));
    }
    // ── ۷. ثبت دستی رویداد از frontend ─────────────────────────────
    // (برای رویدادهایی مثل page_view که از client ارسال می‌شوند)
    async trackFromClient(req, body) {
        // این endpoint بدون نیاز به ادمین بودن — کاربر عادی هم می‌تواند
        await this.crm.track({
            userId: req.user?.id ?? null,
            eventType: body.eventType,
            severity: user_behavior_event_entity_1.EventSeverity.INFO,
            pagePath: body.pagePath,
            sessionId: body.sessionId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: body.metadata,
        });
        return { ok: true };
    }
};
exports.CrmController = CrmController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Patch)('alerts/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "updateAlert", null);
__decorate([
    (0, common_1.Post)('analyze'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "triggerAnalysis", null);
__decorate([
    (0, common_1.Get)('churn-risk'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getChurnRisk", null);
__decorate([
    (0, common_1.Get)('users/:userId/summary'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getUserSummary", null);
__decorate([
    (0, common_1.Get)('users/:userId/events'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getUserEvents", null);
__decorate([
    (0, common_1.Post)('track'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "trackFromClient", null);
exports.CrmController = CrmController = __decorate([
    (0, common_1.Controller)('crm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [crm_service_1.CrmService])
], CrmController);
