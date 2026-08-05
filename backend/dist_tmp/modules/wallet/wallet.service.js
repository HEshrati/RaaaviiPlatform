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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
let WalletService = class WalletService {
    constructor(usersRepository, paymentsRepository) {
        this.usersRepository = usersRepository;
        this.paymentsRepository = paymentsRepository;
    }
    async getWallet(userId) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        return {
            balance: Number(user.credits_balance) || 0,
            currency: 'IRR',
        };
    }
    async getTransactions(userId) {
        const payments = await this.paymentsRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: 50,
        });
        return payments.map((p) => ({
            id: p.id,
            type: p.refund_amount ? 'refund' : p.payment_method === 'wallet_debit' ? 'debit' : 'charge',
            amount: Number(p.refund_amount || p.amount),
            description: p.description || (p.payment_method === 'wallet_debit' ? 'پرداخت از کیف پول' : 'شارژ کیف پول'),
            status: p.status,
            createdAt: p.created_at,
            referenceId: p.gateway_reference,
        }));
    }
    async chargeWallet(userId, amount, callbackUrl, ipAddress) {
        if (amount < 10000) {
            throw new common_1.BadRequestException('حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است');
        }
        if (amount > 50_000_000) {
            throw new common_1.BadRequestException('حداکثر مبلغ شارژ ۵۰,۰۰۰,۰۰۰ تومان است');
        }
        // ثبت تراکنش در انتظار
        const payment = this.paymentsRepository.create({
            user_id: userId,
            amount,
            currency: 'IRR',
            payment_method: 'zarinpal',
            payment_gateway: 'zarinpal',
            description: `شارژ کیف پول به مبلغ ${amount.toLocaleString()} تومان`,
            status: 'pending',
            metadata: { callbackUrl, type: 'wallet_charge' },
            ip_address: ipAddress,
        });
        const savedPayment = await this.paymentsRepository.save(payment);
        // در اینجا درخواست به زرین‌پال ارسال می‌شود
        // برای سادگی، mock response ارائه می‌شود
        // در production باید با ZarinpalService یکپارچه شود
        const mockPaymentUrl = `${callbackUrl}?paymentId=${savedPayment.id}&mock=true`;
        return {
            paymentId: savedPayment.id,
            paymentUrl: mockPaymentUrl,
            amount,
        };
    }
    async confirmCharge(paymentId, userId) {
        const payment = await this.paymentsRepository.findOne({
            where: { id: paymentId, user_id: userId, status: 'pending' },
        });
        if (!payment)
            throw new common_1.NotFoundException('تراکنش یافت نشد');
        // تأیید پرداخت و افزایش موجودی
        payment.status = 'completed';
        payment.paid_at = new Date();
        await this.paymentsRepository.save(payment);
        // افزایش موجودی کیف پول
        await this.usersRepository.increment({ id: userId }, 'credits_balance', Number(payment.amount));
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        return {
            success: true,
            newBalance: Number(user?.credits_balance) || 0,
            amount: Number(payment.amount),
        };
    }
    async debitWallet(userId, amount, description, bookingId) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        const balance = Number(user.credits_balance) || 0;
        if (balance < amount) {
            throw new common_1.BadRequestException('موجودی کافی نیست');
        }
        // کسر موجودی
        await this.usersRepository.decrement({ id: userId }, 'credits_balance', amount);
        // ثبت تراکنش
        const payment = this.paymentsRepository.create({
            user_id: userId,
            booking_id: bookingId,
            amount,
            currency: 'IRR',
            payment_method: 'wallet_debit',
            description,
            status: 'completed',
            paid_at: new Date(),
        });
        await this.paymentsRepository.save(payment);
        return { success: true, newBalance: balance - amount };
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WalletService);
