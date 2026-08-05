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
var SupportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const support_ticket_entity_1 = require("./entities/support-ticket.entity");
const AI_API_KEY = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const AI_API_URL = process.env.AI_API_URL || 'https://api.gapgpt.app/v1';
const TELEGRAM_SUPPORT_URL = process.env.TELEGRAM_SUPPORT_URL || 'https://t.me/ravi_support';
const RAVI_FAQ_SYSTEM_PROMPT = `
تو دستیار پشتیبانی راوی هستی، یک پلتفرم هوشمند برای برگزاری دورهمی‌های اجتماعی در ایران.

اطلاعات کلی راوی:
- راوی یک پلتفرم است که با الگوریتم هوشمند افراد هم‌ذوق را در دورهمی‌های کوچک ۴-۶ نفره دور هم جمع می‌کند
- ثبت‌نام رایگان است اما شرکت در رویدادها نیاز به پرداخت هزینه دارد
- آدرس دقیق ۱۰ ساعت قبل از رویداد نمایش داده می‌شود
- در صورت عدم حضور دو بار، حساب کاربری موقتاً ساسپند می‌شود
- برای بازگشت بعد از ساسپند باید با تیم راوی تماس بگیرید

سوالات متداول که می‌توانی پاسخ دهی:
- نحوه ثبت‌نام و شرکت در رویدادها
- نحوه رزرو و پرداخت
- قوانین راوی
- درباره الگوریتم مچینگ
- نحوه لغو رزرو
- سوالات درباره گروه‌های تلگرامی

قوانین پاسخ:
1. فقط به سوالات مرتبط با راوی پاسخ بده
2. پاسخ‌ها کوتاه، مفید و دوستانه باشد
3. اگر سوال خارج از حوزه راوی است یا نیاز به بررسی شخصی دارد، کاربر را به تلگرام پشتیبانی هدایت کن
4. از کلمات مودبانه فارسی استفاده کن
`;
let SupportService = SupportService_1 = class SupportService {
    constructor(ticketRepo) {
        this.ticketRepo = ticketRepo;
        this.logger = new common_1.Logger(SupportService_1.name);
    }
    async createTicket(userId, data) {
        const ticket = this.ticketRepo.create({
            user_id: userId || undefined,
            subject: data.subject,
            message: data.message,
            category: data.category,
            contact_phone: data.contactPhone,
            contact_name: data.contactName,
            status: support_ticket_entity_1.TicketStatus.OPEN,
        });
        const saved = await this.ticketRepo.save(ticket);
        // تلاش برای پاسخ خودکار AI
        await this.tryAutoRespond(saved);
        return saved;
    }
    async tryAutoRespond(ticket) {
        try {
            const response = await fetch(`${AI_API_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${AI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: RAVI_FAQ_SYSTEM_PROMPT },
                        {
                            role: 'user',
                            content: `موضوع: ${ticket.subject}\n\nسوال: ${ticket.message}`,
                        },
                    ],
                    max_tokens: 500,
                    temperature: 0.3,
                }),
            });
            if (!response.ok)
                return;
            const data = await response.json();
            const aiResponse = data.choices?.[0]?.message?.content || '';
            if (aiResponse) {
                // بررسی اینکه آیا AI نیاز به ارجاع به انسان دارد
                const needsHuman = aiResponse.includes(TELEGRAM_SUPPORT_URL) ||
                    aiResponse.toLowerCase().includes('پشتیبانی') ||
                    aiResponse.toLowerCase().includes('تماس');
                await this.ticketRepo.update(ticket.id, {
                    ai_response: needsHuman
                        ? `${aiResponse}\n\n🔗 برای پشتیبانی بیشتر: ${TELEGRAM_SUPPORT_URL}`
                        : aiResponse,
                    ai_resolved: !needsHuman,
                    status: needsHuman ? support_ticket_entity_1.TicketStatus.PENDING_HUMAN : support_ticket_entity_1.TicketStatus.AI_ANSWERED,
                });
            }
        }
        catch (err) {
            this.logger.error('خطا در پاسخ خودکار AI', err);
        }
    }
    // ── چت هوشمند سایت (Chat Assistant) ────────────────────────
    async chatWithAI(message, history) {
        const messages = [
            { role: 'system', content: RAVI_FAQ_SYSTEM_PROMPT },
            ...history.slice(-6), // آخرین ۶ پیام برای context
            { role: 'user', content: message },
        ];
        const response = await fetch(`${AI_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${AI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages,
                max_tokens: 600,
                temperature: 0.4,
            }),
        });
        if (!response.ok) {
            throw new Error('خطا در ارتباط با AI');
        }
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'متأسفم، نمی‌توانم در حال حاضر پاسخ دهم.';
        // اگر AI نمی‌تواند پاسخ دهد، لینک تلگرام را اضافه کن
        if (reply.includes('نمی‌توانم') || reply.includes('نمی‌دانم') || reply.includes('خارج از')) {
            return `${reply}\n\n📱 برای پشتیبانی مستقیم: [تیم راوی](${TELEGRAM_SUPPORT_URL})`;
        }
        return reply;
    }
    async findUserTickets(userId) {
        return await this.ticketRepo.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });
    }
    async findAllTickets(status) {
        const where = {};
        if (status)
            where.status = status;
        return await this.ticketRepo.find({
            where,
            order: { created_at: 'DESC' },
        });
    }
    async closeTicket(id, adminResponse) {
        const ticket = await this.ticketRepo.findOne({ where: { id } });
        if (!ticket)
            throw new common_1.NotFoundException('تیکت یافت نشد');
        ticket.status = support_ticket_entity_1.TicketStatus.CLOSED;
        ticket.admin_response = adminResponse;
        ticket.resolved_at = new Date();
        return await this.ticketRepo.save(ticket);
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = SupportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(support_ticket_entity_1.SupportTicket)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SupportService);
