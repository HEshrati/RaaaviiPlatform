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
exports.AiChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const test_result_entity_1 = require("../test-results/entities/test-result.entity");
const profile_entity_1 = require("../profiles/entities/profile.entity");
const user_behavior_event_entity_1 = require("../crm/entities/user-behavior-event.entity");
const crm_ai_alert_entity_1 = require("../crm/entities/crm-ai-alert.entity");
const user_entity_1 = require("../users/entities/user.entity");
const AI_BASE = (process.env.AI_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://api.gapgpt.app/v1') + '/chat/completions';
const AI_KEY = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
let AiChatService = class AiChatService {
    constructor(testRepo, profileRepo, behaviorRepo, alertRepo, userRepo) {
        this.testRepo = testRepo;
        this.profileRepo = profileRepo;
        this.behaviorRepo = behaviorRepo;
        this.alertRepo = alertRepo;
        this.userRepo = userRepo;
    }
    async userChat(userId, messages) {
        const [profile, tests] = await Promise.all([
            this.profileRepo.findOne({ where: { user_id: userId } }),
            this.testRepo.find({ where: { user_id: userId }, order: { completed_at: 'DESC' } }),
        ]);
        const profileSummary = profile
            ? `نام: ${profile.first_name || ''} ${profile.last_name || ''} | جنسیت: ${profile.gender || '—'} | تاهل: ${profile.marital_status || '—'}`
            : 'پروفایل تکمیل نشده';
        // تفسیر هوشمند scores
        function interpretScore(name, s) {
            const toP = (v, mx) => v != null ? Math.round(Number(v) / mx * 100) : 0;
            if (name === 'neo_ffi') {
                const E = s.E || 0, A = s.A || 0, C = s.C || 0, N = s.N || 0, O = s.O || 0;
                return `📊 NEO پنج عامل:
  برون‌گرایی: ${E}/30 (${toP(E, 30)}٪) - ${E >= 18 ? 'بالا:اجتماعی' : E <= 12 ? 'پایین:درون‌گرا' : 'متوسط'}
  توافق: ${A}/30 (${toP(A, 30)}٪) - ${A >= 18 ? 'بالا:همکار' : A <= 12 ? 'پایین:مستقل' : 'متوسط'}
  وجدان: ${C}/30 (${toP(C, 30)}٪) - ${C >= 18 ? 'بالا:منظم' : C <= 12 ? 'پایین:انعطاف‌پذیر' : 'متوسط'}
  روان‌رنجوری: ${N}/30 (${toP(N, 30)}٪) - ${N >= 18 ? 'بالا:حساس به استرس' : N <= 12 ? 'پایین:ثبات بالا' : 'متوسط'}
  گشودگی: ${O}/30 (${toP(O, 30)}٪) - ${O >= 18 ? 'بالا:خلاق' : O <= 12 ? 'پایین:محافظه‌کار' : 'متوسط'}`;
            }
            if (name === 'ecr_r') {
                const ANX = s.ANX || 0, AVO = s.AVO || 0;
                return `💔 دلبستگی ECR:
  اضطراب: ${ANX}/63 (${toP(ANX, 63)}٪) - ${ANX >= 36 ? 'بالا:ترس از طرد' : ANX < 27 ? 'پایین:احساس امنیت' : 'متوسط'}
  اجتناب: ${AVO}/63 (${toP(AVO, 63)}٪) - ${AVO >= 36 ? 'بالا:فاصله‌گذاری' : AVO < 27 ? 'پایین:صمیمیت راحت' : 'متوسط'}
  سبک: ${ANX < 27 && AVO < 27 ? 'ایمن' : ANX >= 36 && AVO < 36 ? 'دلمشغول' : AVO >= 36 && ANX < 36 ? 'اجتنابی' : 'ترسان'}`;
            }
            if (name === 'erq') {
                const CR = s.CR || 0, ES = s.ES || 0;
                return `⚖️ تنظیم هیجان ERQ:
  بازارزیابی: ${CR}/42 (${toP(CR, 42)}٪) - ${CR >= 28 ? 'بالا:مقابله سالم' : CR <= 14 ? 'پایین:نیاز تقویت' : 'متوسط'}
  سرکوب: ${ES}/28 (${toP(ES, 28)}٪) - ${ES >= 18 ? 'بالا:پنهان‌کاری' : 'سطح سالم'}`;
            }
            if (name === 'iri') {
                const EC = s.EC || 0, PT = s.PT || 0, FS = s.FS || 0, PD = s.PD || 0;
                return `🤝 همدلی IRI:
  عاطفی: ${EC}/28 (${toP(EC, 28)}٪) | شناختی: ${PT}/28 (${toP(PT, 28)}٪)
  تخیل: ${FS}/28 (${toP(FS, 28)}٪) | پریشانی: ${PD}/28 (${toP(PD, 28)}٪)`;
            }
            if (name === 'gottman') {
                const total = s.total || 0;
                return `💑 گاتمان: ${total}/11 - ${total >= 7 ? 'پرخطر:الگوهای مخرب قوی' : total >= 4 ? 'متوسط:نیاز توجه' : 'مناسب:الگوهای سالم'}`;
            }
            if (name === 'phq9')
                return `🌿 افسردگی PHQ9: ${s.total || 0}/27 - ${(s.total || 0) >= 20 ? 'شدید' : (s.total || 0) >= 15 ? 'متوسط-شدید' : (s.total || 0) >= 10 ? 'متوسط' : (s.total || 0) >= 5 ? 'خفیف' : 'حداقل'}`;
            if (name === 'gad7')
                return `😰 اضطراب GAD7: ${s.total || 0}/21 - ${(s.total || 0) >= 15 ? 'شدید' : (s.total || 0) >= 10 ? 'متوسط' : (s.total || 0) >= 5 ? 'خفیف' : 'حداقل'}`;
            if (name.includes('matching_basis') || name === 'mbti')
                return `🧠 MBTI: ${s.EI >= 0 ? 'E' : 'I'}${s.SN >= 0 ? 'N' : 'S'}${s.TF >= 0 ? 'F' : 'T'}${s.JP >= 0 ? 'P' : 'J'}`;
            return `${name}: ${JSON.stringify(s).slice(0, 60)}`;
        }
        const testsSummary = tests.length === 0
            ? 'هیچ تستی انجام نشده.'
            : tests.map(t => {
                const s = typeof t.scores === 'string' ? JSON.parse(t.scores || '{}') : t.scores || {};
                return interpretScore(t.test_name, s);
            }).join('\n\n');
        const systemPrompt = `تو روانشناس متخصص پلتفرم راوی هستی با تبحر در تفسیر تست‌های روان‌سنجی.

پروفایل: ${profileSummary}

━━━ نتایج دقیق تست‌ها ━━━
${testsSummary}
━━━━━━━━━━━━━━━━━━━━━

وقتی کاربر سوال میپرسه:
۱. به اعداد و درصدهای دقیق اشاره کن (مثلاً: "اضطراب دلبستگی ۴۶٪ نشان می‌دهد...")
۲. ارتباط بین تست‌ها را توضیح بده
۳. ساختار پاسخ:
   ## 📊 تحلیل نتایج (با ذکر اعداد دقیق)
   ## 🔗 ارتباط بین ابعاد
   ## 💪 نقاط قوت
   ## 🎯 پیشنهادات عملی
۴. فارسی، گرم و علمی باشد`;
        return this.callAI(systemPrompt, messages);
    }
    async adminChat(messages) {
        const [totalUsers, totalTests, openAlerts, recentAlerts] = await Promise.all([
            this.userRepo.count(),
            this.testRepo.count(),
            this.alertRepo.count({ where: { status: 'open' } }),
            this.alertRepo.find({ where: { status: 'open' }, order: { created_at: 'DESC' }, take: 10 }),
        ]);
        const alertsSummary = recentAlerts.map(a => `[${a.severity}] ${a.alert_type}: ${a.ai_analysis?.slice(0, 100)}`).join('\n') || 'هشداری نیست';
        const systemPrompt = `تو دستیار تحلیلگر ادمین پلتفرم راوی هستی.
آمار: کل کاربران: ${totalUsers} | کل تست‌ها: ${totalTests} | هشدارهای باز: ${openAlerts}
هشدارهای اخیر:\n${alertsSummary}
- فارسی پاسخ بده - تحلیل داده‌محور بده`;
        return this.callAI(systemPrompt, messages);
    }
    async adminUserChat(targetUserId, messages) {
        const [profile, tests, behaviors] = await Promise.all([
            this.profileRepo.findOne({ where: { user_id: targetUserId } }),
            this.testRepo.find({ where: { user_id: targetUserId }, order: { completed_at: 'DESC' } }),
            this.behaviorRepo.find({ where: { user_id: targetUserId }, order: { created_at: 'DESC' }, take: 50 }),
        ]);
        const systemPrompt = `تو دستیار CRM ادمین هستی.
پروفایل: ${profile ? `${profile.first_name} ${profile.last_name}` : 'ناقص'}
تست‌ها: ${tests.map(t => `${t.test_name}: ${t.main_result}`).join(' | ') || 'ندارد'}
رفتار: ${behaviors.map(b => b.event_type).join(', ') || 'ندارد'}
فارسی پاسخ بده`;
        return this.callAI(systemPrompt, messages);
    }
    async callAI(systemPrompt, messages) {
        const res = await fetch(AI_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}` },
            body: JSON.stringify({ model: AI_MODEL, max_tokens: 4000, messages: [{ role: 'system', content: systemPrompt }, ...messages] }),
        });
        if (!res.ok)
            throw new Error(`AI API error: ${await res.text()}`);
        const data = await res.json();
        return { reply: data.choices?.[0]?.message?.content || 'پاسخی دریافت نشد.' };
    }
    async streamUserChat(userId, messages, res) {
        const [profile, tests] = await Promise.all([
            this.profileRepo.findOne({ where: { user_id: userId } }),
            this.testRepo.find({ where: { user_id: userId }, order: { completed_at: 'DESC' } }),
        ]);
        const profileSummary = profile
            ? `نام: ${profile.first_name || ''} ${profile.last_name || ''}`
            : 'پروفایل تکمیل نشده';
        function interpretScore(name, s) {
            const toP = (v, mx) => v != null ? Math.round(Number(v) / mx * 100) : 0;
            if (name === 'neo_ffi')
                return `NEO: E=${s.E || 0}/30(${toP(s.E, 30)}٪) A=${s.A || 0}/30(${toP(s.A, 30)}٪) C=${s.C || 0}/30(${toP(s.C, 30)}٪) N=${s.N || 0}/30(${toP(s.N, 30)}٪) O=${s.O || 0}/30(${toP(s.O, 30)}٪)`;
            if (name === 'ecr_r')
                return `ECR: اضطراب=${s.ANX || 0}/63(${toP(s.ANX, 63)}٪) اجتناب=${s.AVO || 0}/63(${toP(s.AVO, 63)}٪)`;
            if (name === 'erq')
                return `ERQ: بازارزیابی=${s.CR || 0}/42(${toP(s.CR, 42)}٪) سرکوب=${s.ES || 0}/28(${toP(s.ES, 28)}٪)`;
            if (name === 'iri')
                return `IRI: عاطفی=${s.EC || 0}/28 شناختی=${s.PT || 0}/28`;
            if (name === 'gottman')
                return `گاتمان: ${s.total || 0}/11 ${(s.total || 0) >= 7 ? 'پرخطر' : (s.total || 0) >= 4 ? 'متوسط' : 'سالم'}`;
            if (name === 'phq9')
                return `PHQ9: ${s.total || 0}/27`;
            if (name === 'gad7')
                return `GAD7: ${s.total || 0}/21`;
            return `${name}: ${JSON.stringify(s).slice(0, 50)}`;
        }
        const testsSummary = tests.length === 0 ? 'هیچ تستی انجام نشده' :
            tests.map(t => interpretScore(t.test_name, typeof t.scores === 'string' ? JSON.parse(t.scores || '{}') : t.scores || {})).join('\n');
        const systemPrompt = `تو روانشناس متخصص پلتفرم راوی هستی.
پروفایل: ${profileSummary}
نتایج تست‌ها:
${testsSummary}
به اعداد دقیق اشاره کن. فارسی، گرم و علمی باشد. از ## برای تیتر استفاده کن.`;
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders?.();
        try {
            const apiRes = await fetch(AI_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}` },
                body: JSON.stringify({
                    model: AI_MODEL, max_tokens: 4000, stream: true,
                    messages: [{ role: 'system', content: systemPrompt }, ...messages]
                }),
            });
            if (!apiRes.ok) {
                res.write(`data: ${JSON.stringify({ error: 'AI error' })}

`);
                res.end();
                return;
            }
            const reader = apiRes.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) {
                res.end();
                return;
            }
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') {
                            res.write('data: [DONE]\n\n');
                            continue;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content)
                                res.write(`data: ${JSON.stringify({ content })}

`);
                        }
                        catch { }
                    }
                }
            }
        }
        catch (e) {
            res.write(`data: ${JSON.stringify({ error: 'stream error' })}

`);
        }
        res.end();
    }
};
exports.AiChatService = AiChatService;
exports.AiChatService = AiChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(test_result_entity_1.TestResult)),
    __param(1, (0, typeorm_1.InjectRepository)(profile_entity_1.Profile)),
    __param(2, (0, typeorm_1.InjectRepository)(user_behavior_event_entity_1.UserBehaviorEvent)),
    __param(3, (0, typeorm_1.InjectRepository)(crm_ai_alert_entity_1.CrmAiAlert)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AiChatService);
