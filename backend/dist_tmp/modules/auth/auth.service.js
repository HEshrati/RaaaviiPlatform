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
exports.AuthService = void 0;
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_1 = require("@nestjs/common");
const typeorm_3 = require("@nestjs/typeorm");
const typeorm_4 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const user_entity_1 = require("../../database/entities/user.entity");
const bcrypt = __importStar(require("bcryptjs"));
const OTP_API_KEY = process.env.OTP_API_KEY || '';
const OTP_TEMPLATE_ID = parseInt(process.env.OTP_TEMPLATE_ID || '100000');
const IS_DEV = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_OTP === 'true';
// OTP store with rate limiting: tracks OTP code + request count
const otpStore = new Map();
const OTP_MAX_ATTEMPTS = 5; // max wrong guesses
const OTP_RATE_LIMIT_MS = 60_000; // 1 minute between requests
let AuthService = class AuthService {
    constructor(userRepository, jwtService, dataSource) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.dataSource = dataSource;
    }
    async sendOtp(phone, role) {
        if (!phone || typeof phone !== 'string') {
            throw new common_1.BadRequestException('شماره موبایل الزامی است');
        }
        console.log('RAW PHONE =>', phone);
        const cleanPhone = phone.replace(/\D/g, '');
        if (!/^09\d{9}$/.test(cleanPhone)) {
            throw new common_1.BadRequestException('Invalid phone number. Example: 09123456789');
        }
        // Rate limit: prevent spam requests
        const existing = otpStore.get(cleanPhone);
        if (existing && Date.now() - existing.lastRequest < OTP_RATE_LIMIT_MS) {
            const wait = Math.ceil((OTP_RATE_LIMIT_MS - (Date.now() - existing.lastRequest)) / 1000);
            throw new common_1.BadRequestException(`لطفاً ${wait} ثانیه صبر کنید`);
        }
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(cleanPhone, {
            code: otpCode,
            expiresAt: Date.now() + 5 * 60 * 1000,
            attempts: 0,
            lastRequest: Date.now(),
            role: role || 'user',
        });
        // ذخیره در DB برای دسترسی بله
        try {
            await this.dataSource.query(`DELETE FROM otps WHERE mobile_number = $1`, [cleanPhone]);
            await this.dataSource.query(`INSERT INTO otps (code, mobile_number, expires_at, is_used) VALUES ($1, $2, NOW() + INTERVAL '5 minutes', false)`, [otpCode, cleanPhone]);
        }
        catch { }
        // DEV MODE
        if (IS_DEV) {
            return { message: 'OTP sent (DEV mode - check console or dev_code field)', dev_code: otpCode };
        }
        // PRODUCTION: بله اول، بعد SMS
        let baleSent = false;
        let smsSent = false;
        try {
            const normPhone = cleanPhone.replace(/^0/, '98');
            const baleRows = await this.dataSource.query('SELECT chat_id FROM bale_user_chats WHERE phone=$1 LIMIT 1', [normPhone]);
            if (baleRows?.[0]?.chat_id) {
                const baleToken = process.env.BALE_BOT_TOKEN || '';
                const baleApi = process.env.BALE_BOT_API_URL || 'https://tapi.bale.ai';
                const msg = '🔐 *کد ورود راوی*\n\nکد: `' + otpCode + '`\n\n⏱ ۵ دقیقه اعتبار دارد';
                const r = await fetch(`${baleApi}/bot${baleToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: String(baleRows[0].chat_id), text: msg, parse_mode: 'Markdown' }),
                });
                const rd = await r.json();
                baleSent = rd?.ok === true;
            }
        }
        catch { }
        if (OTP_API_KEY && OTP_API_KEY.length > 10) {
            try {
                const ctrl = new AbortController();
                setTimeout(() => ctrl.abort(), 8000);
                console.log('SMS BODY =>', JSON.stringify({ mobile: cleanPhone, templateId: OTP_TEMPLATE_ID, parameters: [{ name: 'Code', value: otpCode }] }));
                const res = await fetch('https://api.sms.ir/v1/send/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': OTP_API_KEY },
                    body: JSON.stringify({ mobile: cleanPhone, templateId: OTP_TEMPLATE_ID, parameters: [{ name: 'Code', value: otpCode }] }),
                    signal: ctrl.signal,
                });
                smsSent = res.ok;
            }
            catch { }
        }
        return {
            message: smsSent ? (baleSent ? 'کد از طریق پیامک و بله ارسال شد' : 'کد از طریق پیامک ارسال شد') : (baleSent ? 'کد از طریق بله ارسال شد' : 'کد ارسال شد'), via: smsSent ? (baleSent ? 'sms+bale' : 'sms') : (baleSent ? 'bale' : 'unknown'),
        };
    }
    async verifyOtp(phone, code, name) {
        if (!phone || typeof phone !== 'string') {
            throw new common_1.BadRequestException('شماره موبایل الزامی است');
        }
        const cleanPhone = phone.replace(/\D/g, '');
        const stored = otpStore.get(cleanPhone);
        if (!stored)
            throw new common_1.BadRequestException('OTP expired or not sent');
        if (Date.now() > stored.expiresAt) {
            otpStore.delete(cleanPhone);
            throw new common_1.BadRequestException('OTP expired');
        }
        // Brute-force protection
        stored.attempts = (stored.attempts || 0) + 1;
        if (stored.attempts > OTP_MAX_ATTEMPTS) {
            otpStore.delete(cleanPhone);
            throw new common_1.BadRequestException('تعداد تلاش‌ها از حد مجاز گذشت. لطفاً کد جدید دریافت کنید');
        }
        if (stored.code !== code)
            throw new common_1.BadRequestException('کد وارد شده اشتباه است');
        otpStore.delete(cleanPhone);
        let user = await this.userRepository.findOne({ where: { mobileNumber: cleanPhone } });
        if (!user) {
            // بررسی نام+فامیل تکراری
            if (name && name.trim()) {
                const nameTrimmed = name.trim().replace(/\s+/g, ' ');
                const nameExists = await this.userRepository.findOne({ where: { name: nameTrimmed } });
                if (nameExists) {
                    throw new common_1.BadRequestException('این نام و نام خانوادگی قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.');
                }
            }
            user = this.userRepository.create({ mobileNumber: cleanPhone, isVerified: true, role: stored.role || 'user', name: name ? name.trim() : '' });
            await this.userRepository.save(user);
        }
        else {
            user.isVerified = true;
            if (name && !user.name)
                user.name = name;
            if (stored.role && stored.role !== 'user')
                user.role = stored.role;
            await this.userRepository.save(user);
        }
        const access_token = this.jwtService.sign({
            userId: user.id,
            mobileNumber: user.mobileNumber,
            role: user.role,
            isTestTaken: user.isTestTaken || false,
        });
        return {
            access_token,
            user: {
                id: user.id,
                name: user.name || '',
                mobileNumber: user.mobileNumber,
                avatar: user.avatar,
                role: user.role,
                isTestTaken: user.isTestTaken || false,
                // Profile is complete when user has name (city is checked client-side via AppContext)
                isProfileComplete: !!(user.name && user.name.trim()),
            },
        };
    }
    async register(dto) {
        const { email, mobileNumber, password } = dto;
        const where = [];
        if (email)
            where.push({ email });
        if (mobileNumber)
            where.push({ mobileNumber });
        const existing = where.length > 0 ? await this.userRepository.findOne({ where }) : null;
        if (existing)
            throw new common_1.BadRequestException('User already registered');
        const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
        const user = this.userRepository.create({ email, mobileNumber, passwordHash, isVerified: false, role: 'user' });
        await this.userRepository.save(user);
        return {
            access_token: this.jwtService.sign({ userId: user.id, email: user.email, role: user.role }),
            user,
        };
    }
    async login(dto) {
        const { identifier, password } = dto;
        const isEmail = identifier.includes('@');
        const user = await this.userRepository.findOne({
            where: isEmail ? { email: identifier } : { mobileNumber: identifier },
        });
        if (!user || !user.passwordHash)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return {
            access_token: this.jwtService.sign({ userId: user.id, email: user.email, role: user.role }),
            user,
        };
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return {
            id: user.id,
            name: user.name || '',
            mobileNumber: user.mobileNumber,
            avatar: user.avatar,
            role: user.role,
            isTestTaken: user.isTestTaken || false,
            isProfileComplete: !!user.name,
        };
    }
    async markTestTaken(userId) {
        await this.userRepository.update(userId, { isTestTaken: true });
        return { success: true };
    }
    async validateUser(userId) {
        return this.userRepository.findOne({ where: { id: userId } });
    }
    async checkPhoneExists(phone) {
        if (!phone || typeof phone !== 'string') {
            throw new common_1.BadRequestException('شماره موبایل الزامی است');
        }
        const clean = phone.replace(/\D/g, '');
        const user = await this.userRepository.findOne({ where: { mobileNumber: clean } });
        return !!user;
    }
    // بررسی تکراری بودن نام+فامیل
    async checkNameExists(name) {
        if (!name || !name.trim())
            return false;
        const normalized = name.trim().replace(/\s+/g, ' ');
        const user = await this.userRepository.findOne({ where: { name: normalized } });
        return !!user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_3.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_4.Repository,
        jwt_1.JwtService,
        typeorm_2.DataSource])
], AuthService);
