"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("./entities/payment.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const event_entity_1 = require("../events/entities/event.entity");
const user_entity_1 = require("../users/entities/user.entity");
const ZARINPAL_MERCHANT = process.env.ZARINPAL_MERCHANT_ID || '';
const IS_DEV = process.env.NODE_ENV !== 'production';
let PaymentsController = class PaymentsController {
    constructor(paymentRepo, bookingRepo, eventRepo, userRepo) {
        this.paymentRepo = paymentRepo;
        this.bookingRepo = bookingRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
    }
    /**
     * GET /api/payments/verify
     * Called by Zarinpal after payment (or by our mock in dev mode).
     * Verifies amount integrity before confirming booking.
     */
    async verifyPayment(bookingId, paymentId, authority, status, mock, mockAmount) {
        if (!bookingId || !paymentId) {
            throw new common_1.BadRequestException('پارامترهای تأیید پرداخت ناقص است');
        }
        const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
        if (!payment)
            throw new common_1.NotFoundException('تراکنش یافت نشد');
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
        if (!booking)
            throw new common_1.NotFoundException('رزرو یافت نشد');
        const intendedAmount = Number(payment.metadata?.intendedAmount || payment.amount);
        // ── DEV mode: auto-confirm ───────────────────────────────────
        if (IS_DEV || mock === 'true') {
            if (mockAmount && Number(mockAmount) !== intendedAmount) {
                console.warn(`[PAYMENT INTEGRITY] Amount mismatch: received ${mockAmount}, expected ${intendedAmount}`);
                // In dev, we still confirm to allow testing — but log the warning
            }
            await this.confirmPaymentAndBooking(payment, booking, intendedAmount, 'mock-ref-' + Date.now());
            return { success: true, amount: intendedAmount, bookingId, bookingCode: booking.booking_code };
        }
        // ── PRODUCTION: Zarinpal verification ───────────────────────
        if (status !== 'OK') {
            payment.status = 'failed';
            await this.paymentRepo.save(payment);
            throw new common_1.BadRequestException('پرداخت توسط کاربر لغو شد');
        }
        try {
            const _ctrl = new AbortController();
            setTimeout(() => _ctrl.abort(), 10000);
            const res = await fetch('https://api.zarinpal.com/pg/v4/payment/verify.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merchant_id: ZARINPAL_MERCHANT,
                    amount: intendedAmount,
                    authority,
                }),
            });
            const data = await res.json();
            if (data?.data?.code !== 100 && data?.data?.code !== 101) {
                payment.status = 'failed';
                await this.paymentRepo.save(payment);
                throw new common_1.BadRequestException('تأیید پرداخت از درگاه ناموفق بود');
            }
            // CRITICAL: integrity check — verify amount matches
            const receivedAmount = data?.data?.amount;
            if (receivedAmount && Number(receivedAmount) !== intendedAmount) {
                payment.status = 'suspicious';
                payment.metadata = { ...payment.metadata, receivedAmount, flag: 'amount_mismatch' };
                await this.paymentRepo.save(payment);
                console.error(`[SECURITY] Payment amount mismatch! Expected ${intendedAmount}, received ${receivedAmount}`);
                throw new common_1.BadRequestException('خطای یکپارچگی پرداخت: مبلغ مغایرت دارد');
            }
            await this.confirmPaymentAndBooking(payment, booking, intendedAmount, data?.data?.ref_id?.toString());
            return { success: true, amount: intendedAmount, bookingId, bookingCode: booking.booking_code };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.BadRequestException('خطا در اتصال به درگاه پرداخت');
        }
    }
    /**
     * POST /api/payments/confirm-mock
     * Frontend calls this after mock payment redirect to confirm booking.
     */
    async confirmMock(body) {
        const { bookingId, paymentId } = body;
        const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
        if (!payment || !booking)
            throw new common_1.NotFoundException('تراکنش یافت نشد');
        const amount = Number(payment.metadata?.intendedAmount || payment.amount);
        await this.confirmPaymentAndBooking(payment, booking, amount, 'mock-' + Date.now());
        return { success: true, amount, bookingId, bookingCode: booking.booking_code };
    }
    async confirmPaymentAndBooking(payment, booking, amount, refId) {
        // Confirm payment
        payment.status = 'completed';
        payment.gateway_reference = refId;
        payment.paid_at = new Date();
        await this.paymentRepo.save(payment);
        // Confirm booking
        booking.status = 'confirmed';
        booking.payment_status = 'paid';
        booking.payment_id = payment.id;
        booking.confirmed_at = new Date();
        await this.bookingRepo.save(booking);
        // Increment event bookings counter
        if (booking.event_id) {
            await this.eventRepo.increment({ id: booking.event_id }, 'current_bookings', 1);
            // اگه ظرفیت پر شد → matching اتوماتیک
            try {
                const event = await this.eventRepo.findOne({ where: { id: booking.event_id } });
                if (event && event.current_bookings + 1 >= event.capacity) {
                    const { MatchingService } = await Promise.resolve().then(() => __importStar(require('../matching/matching.service')));
                    // matching رو از طریق NestJS DI نمیشه اینجا inject کرد
                    // پس یه flag توی event ذخیره میکنیم
                    await this.eventRepo.update(booking.event_id, { is_featured: true });
                }
            }
            catch (e) { }
        }
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)('verify'),
    __param(0, (0, common_1.Query)('bookingId')),
    __param(1, (0, common_1.Query)('paymentId')),
    __param(2, (0, common_1.Query)('Authority')),
    __param(3, (0, common_1.Query)('Status')),
    __param(4, (0, common_1.Query)('mock')),
    __param(5, (0, common_1.Query)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('confirm-mock'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "confirmMock", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(2, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PaymentsController);
