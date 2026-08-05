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
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const optional_jwt_guard_1 = require("../auth/guards/optional-jwt.guard");
const support_service_1 = require("./support.service");
const support_ticket_entity_1 = require("./entities/support-ticket.entity");
const admin_controller_1 = require("../admin/admin.controller");
let SupportController = class SupportController {
    constructor(supportService) {
        this.supportService = supportService;
    }
    // ── چت هوشمند (عمومی) ────────────────────────────────────────
    async chat(body) {
        const reply = await this.supportService.chatWithAI(body.message, body.history || []);
        return { reply };
    }
    // ── ثبت تیکت (کاربر لاگین یا غیرلاگین) ─────────────────────
    async createTicket(req, body) {
        const userId = req.user?.id || null;
        return await this.supportService.createTicket(userId, body);
    }
    // ── تیکت‌های کاربر جاری ─────────────────────────────────────
    async myTickets(req) {
        return await this.supportService.findUserTickets(req.user.id);
    }
    // ── ادمین: همه تیکت‌ها ───────────────────────────────────────
    async allTickets(req, status) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException();
        return await this.supportService.findAllTickets(status);
    }
    // ── ادمین: بستن تیکت ─────────────────────────────────────────
    async closeTicket(req, id, body) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException();
        return await this.supportService.closeTicket(id, body.response);
    }
};
exports.SupportController = SupportController;
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtGuard),
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "chat", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtGuard),
    (0, common_1.Post)('ticket'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "createTicket", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my-tickets'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "myTickets", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('admin/tickets'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "allTickets", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('admin/tickets/:id/close'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "closeTicket", null);
exports.SupportController = SupportController = __decorate([
    (0, common_1.Controller)('support'),
    __metadata("design:paramtypes", [support_service_1.SupportService])
], SupportController);
