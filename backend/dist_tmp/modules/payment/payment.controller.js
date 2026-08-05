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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const payment_service_1 = require("./payment.service");
const express_1 = require("express");
let PaymentController = class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    // ── ایجاد درخواست پرداخت ────────────────────────────
    async requestPayment(req, body) {
        const userId = req.user?.userId || req.user?.id || req.user?.sub;
        const user = await req.user;
        // گرفتن شماره موبایل کاربر
        const userRow = await this.paymentService.ds.query(`SELECT phone_number FROM users WHERE id=$1`, [userId]);
        const mobile = userRow[0]?.phone_number || '';
        return this.paymentService.requestPayment({
            userId,
            bookingId: body.bookingId,
            amount: body.amount,
            description: body.description || 'رزرو همنشینی راوی',
            mobile,
        });
    }
    // ── callback از زرین‌پال ──────────────────────────────
    async verifyPayment(authority, status, res) {
        try {
            const result = await this.paymentService.verifyPayment(authority, status);
            if (result.success) {
                // redirect به صفحه موفق
                return res.redirect(`https://raaviiplatform.com/payment/success?refId=${result.refId}&bookingId=${result.bookingId}`);
            }
            else {
                return res.redirect(`https://raaviiplatform.com/payment/failed?message=${encodeURIComponent(result.message)}`);
            }
        }
        catch (err) {
            return res.redirect(`https://raaviiplatform.com/payment/failed?message=${encodeURIComponent('خطا در تأیید پرداخت')}`);
        }
    }
    // ── وضعیت پرداخت ─────────────────────────────────────
    async getPaymentStatus(bookingId) {
        const ds = this.paymentService.ds;
        const rows = await ds.query(`SELECT status, ref_id, amount, created_at FROM payments WHERE booking_id=$1 ORDER BY created_at DESC LIMIT 1`, [bookingId]);
        return rows[0] || { status: 'not_found' };
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('request'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "requestPayment", null);
__decorate([
    (0, common_1.Get)('verify'),
    __param(0, (0, common_1.Query)('Authority')),
    __param(1, (0, common_1.Query)('Status')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentStatus", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
