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
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const https = __importStar(require("https"));
const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || '';
const IS_SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';
const PROD_REQUEST = 'https://api.zarinpal.com/pg/v4/payment/request.json';
const PROD_VERIFY = 'https://api.zarinpal.com/pg/v4/payment/verify.json';
const PROD_STARTPAY = 'https://www.zarinpal.com/pg/StartPay/';
const SAND_REQUEST = 'https://sandbox.zarinpal.com/pg/v4/payment/request.json';
const SAND_VERIFY = 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json';
const SAND_STARTPAY = 'https://sandbox.zarinpal.com/pg/StartPay/';
const CALLBACK_URL = process.env.ZARINPAL_CALLBACK_URL || 'https://raaviiplatform.com/api/payments/verify';
let PaymentService = PaymentService_1 = class PaymentService {
    constructor(ds) {
        this.ds = ds;
        this.logger = new common_1.Logger(PaymentService_1.name);
    }
    async requestPayment(params) {
        const amountRial = params.amount * 10;
        // ساخت metadata فقط با فیلدهای پر شده
        const metadata = {};
        if (params.mobile && params.mobile.length >= 10)
            metadata.mobile = params.mobile;
        if (params.email && params.email.includes('@'))
            metadata.email = params.email;
        const requestPayload = {
            merchant_id: MERCHANT_ID,
            amount: amountRial,
            callback_url: CALLBACK_URL,
            description: params.description,
        };
        if (Object.keys(metadata).length > 0)
            requestPayload.metadata = metadata;
        const body = JSON.stringify(requestPayload);
        // ابتدا تلاش با درگاه تولیدی
        if (!IS_SANDBOX && MERCHANT_ID) {
            this.logger.log(`Trying production Zarinpal: amount=${params.amount} rial=${amountRial}`);
            try {
                const result = await this.postJson(PROD_REQUEST, body);
                if (result?.data?.code === 100) {
                    const authority = result.data.authority;
                    await this.savePayment(params, authority);
                    this.logger.log(`Production payment OK: authority=${authority}`);
                    return { authority, paymentUrl: `${PROD_STARTPAY}${authority}` };
                }
                const errCode = result?.data?.code || result?.errors?.code || 'unknown';
                const errMsg = result?.errors?.message || '';
                this.logger.warn(`Production Zarinpal failed: code=${errCode} msg=${errMsg}`);
            }
            catch (err) {
                this.logger.warn(`Production Zarinpal error: ${err.message}`);
            }
        }
        // Fallback به sandbox
        this.logger.log(`Using sandbox Zarinpal: amount=${params.amount} rial=${amountRial}`);
        const sandBody = JSON.stringify(requestPayload);
        const sandResult = await this.postJson(SAND_REQUEST, sandBody);
        if (sandResult?.data?.code !== 100) {
            const errCode = sandResult?.data?.code || sandResult?.errors?.code || 'unknown';
            const errMsg = sandResult?.errors?.message || '';
            this.logger.error(`Sandbox Zarinpal also failed: code=${errCode} msg=${errMsg} full=${JSON.stringify(sandResult)}`);
            throw new Error(`خطای زرین‌پال: ${errMsg || 'کد ' + errCode}`);
        }
        const authority = sandResult.data.authority;
        await this.savePayment(params, authority);
        this.logger.log(`Sandbox payment OK: authority=${authority}`);
        return { authority, paymentUrl: `${SAND_STARTPAY}${authority}` };
    }
    async savePayment(params, authority) {
        await this.ds.query(`
      INSERT INTO payments (user_id, booking_id, authority, amount, currency, payment_method, payment_gateway, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'IRR', 'online', 'zarinpal', 'pending', NOW(), NOW())
      ON CONFLICT (authority) DO NOTHING
    `, [params.userId, params.bookingId, authority, params.amount]);
    }
    async verifyPayment(authority, status) {
        if (status !== 'OK') {
            await this.ds.query(`UPDATE payments SET status='cancelled', updated_at=NOW() WHERE authority=$1`, [authority]);
            return { success: false, message: 'پرداخت توسط کاربر لغو شد' };
        }
        const rows = await this.ds.query(`SELECT amount, booking_id, user_id, status, ref_id FROM payments WHERE authority=$1`, [authority]);
        if (!rows.length) {
            return { success: false, message: 'تراکنش یافت نشد' };
        }
        const payment = rows[0];
        if (payment.status === 'verified') {
            return { success: true, refId: payment.ref_id, bookingId: payment.booking_id, message: 'قبلاً تایید شده' };
        }
        const amountRial = payment.amount * 10;
        const isSandboxAuthority = authority.startsWith('S');
        const verifyUrl = isSandboxAuthority ? SAND_VERIFY : PROD_VERIFY;
        const body = JSON.stringify({
            merchant_id: MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            amount: amountRial,
            authority,
        });
        const result = await this.postJson(verifyUrl, body);
        const code = result?.data?.code;
        if (code === 100 || code === 101) {
            const refId = String(result.data.ref_id || '');
            await this.ds.query(`UPDATE payments SET status='verified', ref_id=$1, gateway_reference=$2, updated_at=NOW() WHERE authority=$3`, [refId, refId, authority]);
            if (payment.booking_id) {
                await this.ds.query(`UPDATE bookings SET status='confirmed', payment_status='paid', confirmed_at=NOW() WHERE id=$1`, [payment.booking_id]);
                await this.ds.query(`UPDATE events SET current_bookings = current_bookings + 1 WHERE id = (SELECT event_id FROM bookings WHERE id = $1)`, [payment.booking_id]);
            }
            this.logger.log(`Payment verified: ref=${refId} booking=${payment.booking_id}`);
            return { success: true, refId, bookingId: payment.booking_id, message: `پرداخت موفق — کد پیگیری: ${refId}` };
        }
        await this.ds.query(`UPDATE payments SET status='failed', updated_at=NOW() WHERE authority=$1`, [authority]);
        return { success: false, message: `خطای تایید: کد ${code}` };
    }
    postJson(url, body) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch {
                        reject(new Error('Invalid JSON from Zarinpal'));
                    }
                });
            });
            req.on('error', reject);
            req.setTimeout(15000, () => { req.destroy(); reject(new Error('Zarinpal timeout')); });
            req.write(body);
            req.end();
        });
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], PaymentService);
