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
exports.BotController = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const crypto = __importStar(require("crypto"));
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const user_entity_1 = require("../../database/entities/user.entity");
const profile_entity_1 = require("../profiles/entities/profile.entity");
const event_entity_1 = require("../events/entities/event.entity");
// ─────────────────────────────────────────────────────────────
// in-memory store برای توکن‌های deep link (۱۰ دقیقه)
// ─────────────────────────────────────────────────────────────
const linkTokenStore = new Map();
// پاکسازی هر ۵ دقیقه
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of linkTokenStore.entries()) {
        if (data.expiresAt < now) {
            linkTokenStore.delete(token);
        }
    }
}, 5 * 60 * 1000);
// ─────────────────────────────────────────────────────────────
function verifyBotSecret(secret) {
    if (!secret || secret !== process.env.RAVI_BOT_SECRET) {
        throw new common_1.UnauthorizedException('Invalid bot secret');
    }
}
// ─────────────────────────────────────────────────────────────
let BotController = class BotController {
    constructor(ds, userRepo, profileRepo, eventRepo) {
        this.ds = ds;
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.eventRepo = eventRepo;
    }
    // ═══════════════════════════════════════════════════════════
    // 1) تولید deep link برای اتصال تلگرام
    // GET /api/bot/generate-link-token
    // ═══════════════════════════════════════════════════════════
    async generateLinkToken(req) {
        const userId = req.user.id;
        const user = await this.userRepo.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('کاربر یافت نشد');
        }
        const botUsername = process.env.BOT_USERNAME || 'raaviplatformbot';
        // اگر قبلاً لینک شده
        if (user.telegram_id) {
            return {
                deepLink: `https://t.me/${botUsername}?start=already_linked`,
                expiresInSeconds: 0,
                alreadyLinked: true,
            };
        }
        const token = crypto.randomBytes(9).toString('base64url');
        const EXPIRES_MS = 10 * 60 * 1000;
        linkTokenStore.set(token, {
            userId,
            expiresAt: Date.now() + EXPIRES_MS,
        });
        return {
            deepLink: `https://t.me/${botUsername}?start=${token}`,
            expiresInSeconds: EXPIRES_MS / 1000,
            alreadyLinked: false,
        };
    }
    // ═══════════════════════════════════════════════════════════
    // 2) تأیید توکن و لینک کردن تلگرام
    // POST /api/bot/verify-link-token
    // ═══════════════════════════════════════════════════════════
    async verifyLinkToken(body, secret) {
        verifyBotSecret(secret);
        const { token, telegramId, telegramUsername } = body;
        // حالت already_linked
        if (token === 'already_linked') {
            const user = await this.userRepo.findOne({
                where: { telegram_id: telegramId },
            });
            if (!user) {
                return {
                    success: false,
                    message: 'حساب تلگرام لینک‌نشده‌ای یافت نشد.',
                };
            }
            const profile = await this.profileRepo.findOne({
                where: { user_id: user.id },
            });
            return {
                success: true,
                user: {
                    name: user.name || 'کاربر',
                    city: profile?.city || '',
                    neighborhood: profile?.neighborhood || '',
                    interests: profile?.interests || [],
                    alreadyLinked: true,
                },
            };
        }
        const tokenData = linkTokenStore.get(token);
        if (!tokenData) {
            return {
                success: false,
                message: 'لینک منقضی یا نامعتبر است. از داشبورد دوباره لینک بگیر.',
            };
        }
        if (tokenData.expiresAt < Date.now()) {
            linkTokenStore.delete(token);
            return {
                success: false,
                message: 'لینک منقضی شده. از داشبورد دوباره لینک بگیر.',
            };
        }
        const user = await this.userRepo.findOne({
            where: { id: tokenData.userId },
        });
        if (!user) {
            linkTokenStore.delete(token);
            return {
                success: false,
                message: 'کاربر یافت نشد.',
            };
        }
        // بررسی تداخل
        const conflict = await this.userRepo.findOne({
            where: { telegram_id: telegramId },
        });
        if (conflict && conflict.id !== user.id) {
            return {
                success: false,
                message: 'این حساب تلگرام قبلاً به یک حساب دیگر وصل شده.',
            };
        }
        user.telegram_id = telegramId;
        if (telegramUsername) {
            user.telegram_username = telegramUsername;
        }
        await this.userRepo.save(user);
        linkTokenStore.delete(token);
        const profile = await this.profileRepo.findOne({
            where: { user_id: user.id },
        });
        return {
            success: true,
            user: {
                name: user.name || 'کاربر',
                city: profile?.city || '',
                neighborhood: profile?.neighborhood || '',
                interests: profile?.interests || [],
                alreadyLinked: false,
            },
        };
    }
    // ═══════════════════════════════════════════════════════════
    // 3) رویدادهای هوشمند
    // GET /api/bot/smart-events/:telegramId
    // ═══════════════════════════════════════════════════════════
    async smartEvents(telegramId, secret) {
        verifyBotSecret(secret);
        const user = await this.userRepo.findOne({
            where: { telegram_id: telegramId },
        });
        if (!user) {
            return {
                events: [],
                userName: '',
                userCity: '',
            };
        }
        const profile = await this.profileRepo.findOne({
            where: { user_id: user.id },
        });
        const userCity = profile?.city || '';
        const userInterests = profile?.interests || [];
        const qb = this.eventRepo
            .createQueryBuilder('e')
            .where('e.is_active = :active', {
            active: true,
        })
            .andWhere('e.start_date > :now', {
            now: new Date(),
        });
        if (userCity) {
            qb.andWhere('e.city = :city', {
                city: userCity,
            });
        }
        const events = await qb.orderBy('e.start_date', 'ASC').take(10).getMany();
        const scored = events.map((ev) => {
            const evTags = ev.tags || [];
            const evType = ev.event_type || '';
            let score = 50;
            const matched = userInterests.filter((i) => evTags.some((t) => t.toLowerCase().includes(i.toLowerCase())) ||
                evType.toLowerCase().includes(i.toLowerCase()));
            score += matched.length * 15;
            if (ev.city === userCity) {
                score += 20;
            }
            score = Math.min(score, 98);
            const capacity = Number(ev.capacity) || 10;
            const booked = Number(ev.current_bookings) || 0;
            const spotsLeft = Math.max(0, capacity - booked);
            return {
                id: ev.id,
                title: ev.title,
                city: ev.city || '',
                location: ev.location || '',
                start_date: ev.start_date ? new Date(ev.start_date).toISOString() : '',
                price: Number(ev.price) || 0,
                event_type: ev.event_type || '',
                spotsLeft,
                matchScore: score,
            };
        });
        scored.sort((a, b) => b.matchScore - a.matchScore);
        return {
            events: scored.slice(0, 5),
            userName: user.name || 'کاربر',
            userCity,
        };
    }
    // ═══════════════════════════════════════════════════════════
    // 4) کاربران که تست دادن ولی رزرو نکردن
    // GET /api/bot/tested-not-booked
    // ═══════════════════════════════════════════════════════════
    async getTestedNotBooked(secret) {
        verifyBotSecret(secret);
        try {
            const rows = await this.userRepo.manager.query(`
        SELECT DISTINCT
          u.telegram_id AS "telegramId",
          u.name,
          p.city,
          p.interests,
          p.neighborhood,
          tr.personality_type AS "personalityType"
        FROM users u
        JOIN profiles p ON p.user_id = u.id
        LEFT JOIN test_results tr ON tr.user_id = u.id
        LEFT JOIN bookings b ON b.user_id = u.id
          AND b.status IN ('confirmed','pending')
        WHERE u.telegram_id IS NOT NULL
          AND tr.id IS NOT NULL
          AND b.id IS NULL
        LIMIT 200
      `);
            return { users: rows || [] };
        }
        catch (e) {
            return { users: [] };
        }
    }
    // ═══════════════════════════════════════════════════════════
    // 5) نتایج تست کاربر
    // GET /api/bot/user-test-results/:telegramId
    // ═══════════════════════════════════════════════════════════
    async getUserTestResults(telegramId, secret) {
        verifyBotSecret(secret);
        try {
            const user = await this.userRepo.findOne({ where: { telegram_id: telegramId } });
            if (!user)
                return { results: [] };
            const rows = await this.userRepo.manager.query(`SELECT test_type, personality_type, scores, created_at
         FROM test_results
         WHERE user_id=$1
         ORDER BY created_at DESC
         LIMIT 5`, [user.id]);
            return { results: rows || [] };
        }
        catch (e) {
            return { results: [] };
        }
    }
    // 🆕 گرفتن خلاصه پروفایل برای دستور /profile ربات تلگرام
    async getUserProfile(telegramId) {
        const user = await this.ds.query(`SELECT id FROM users WHERE telegram_id = $1 LIMIT 1`, [telegramId]);
        if (!user.length)
            return { found: false };
        const tests = await this.ds.query(`SELECT DISTINCT ON (test_id) test_id, test_name, main_result, completed_at
       FROM test_results
       WHERE user_id = $1
       ORDER BY test_id, completed_at DESC`, [user[0].id]);
        if (!tests.length)
            return { found: false };
        const nameMap = {
            raavi_matching_basis_v1: 'پایه راوی', mbti: 'MBTI', neo_ffi: 'NEO-FFI',
            ecr_r: 'سبک دلبستگی', erq: 'تنظیم هیجان', iri: 'همدلی',
            hexaco: 'HEXACO', gottman: 'گاتمن', love_languages: 'زبان عشق',
            conflict_style: 'سبک تعارض', phq9: 'سلامت روان', pid5: 'شخصیت',
            sexual_compat: 'سازگاری جنسی',
        };
        const takenTests = tests.map((t) => ({
            id: t.test_id,
            name: nameMap[t.test_id] || t.test_name,
            result: t.main_result,
        }));
        const mbtiTest = tests.find((t) => t.test_id === 'raavi_matching_basis_v1');
        const attachTest = tests.find((t) => t.test_id === 'ecr_r');
        const mentalTest = tests.find((t) => t.test_id === 'phq9');
        const sp = await this.ds.query(`SELECT core_tests_count, total_tests_done, profile_completeness,
              communication_type, dominant_need
       FROM smart_profiles WHERE user_id = $1 LIMIT 1`, [user[0].id]);
        const profile = sp[0] || {};
        return {
            found: true,
            mbti: mbtiTest?.main_result || '؟',
            attachment: attachTest?.main_result || 'مشخص نشده',
            mentalHealth: mentalTest?.main_result || 'مشخص نشده',
            testsCount: tests.length,
            totalTestsDone: profile.total_tests_done || tests.length,
            completeness: profile.profile_completeness || 0,
            communicationType: profile.communication_type || null,
            dominantNeed: profile.dominant_need || null,
            takenTests,
        };
    }
    // 🆕 لینک کردن حساب کاربر با شماره موبایل
    async linkByPhone(body) {
        let rawPhone = body.phone.replace(/\D/g, '');
        let lastTenDigits = rawPhone.slice(-10);
        if (!lastTenDigits || lastTenDigits.length < 10) {
            return { success: false, message: 'فرمت شماره نامعتبر است.' };
        }
        const user = await this.ds.query(`SELECT id, telegram_id FROM users 
       WHERE regexp_replace(phone_number, '[^0-9]', '', 'g') LIKE $1
       LIMIT 1`, [`%${lastTenDigits}`]);
        if (!user.length) {
            return { success: false, message: 'این شماره در سایت راوی ثبت نشده است.' };
        }
        await this.ds.query(`UPDATE users SET telegram_id = $1, telegram_username = $2 WHERE id = $3`, [body.telegramId, body.telegramUsername || null, user[0].id]);
        return { success: true, userId: user[0].id, message: 'حساب با موفقیت متصل شد.' };
    }
};
exports.BotController = BotController;
__decorate([
    (0, common_1.Get)('generate-link-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "generateLinkToken", null);
__decorate([
    (0, common_1.Post)('verify-link-token'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-ravi-bot-secret')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "verifyLinkToken", null);
__decorate([
    (0, common_1.Get)('smart-events/:telegramId'),
    __param(0, (0, common_1.Param)('telegramId')),
    __param(1, (0, common_1.Headers)('x-ravi-bot-secret')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "smartEvents", null);
__decorate([
    (0, common_1.Get)('tested-not-booked'),
    __param(0, (0, common_1.Headers)('x-ravi-bot-secret')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "getTestedNotBooked", null);
__decorate([
    (0, common_1.Get)('user-test-results/:telegramId'),
    __param(0, (0, common_1.Param)('telegramId')),
    __param(1, (0, common_1.Headers)('x-ravi-bot-secret')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "getUserTestResults", null);
__decorate([
    (0, common_1.Get)('user-profile/:telegramId'),
    __param(0, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "getUserProfile", null);
__decorate([
    (0, common_1.Post)('link-by-phone'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotController.prototype, "linkByPhone", null);
exports.BotController = BotController = __decorate([
    (0, common_1.Controller)('bot'),
    __param(1, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_2.InjectRepository)(profile_entity_1.Profile)),
    __param(3, (0, typeorm_2.InjectRepository)(event_entity_1.Event)),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository])
], BotController);
