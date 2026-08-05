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
var BaleBotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaleBotService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let BaleBotService = BaleBotService_1 = class BaleBotService {
    constructor(ds) {
        this.ds = ds;
        this.logger = new common_1.Logger(BaleBotService_1.name);
        this.token = process.env.BALE_BOT_TOKEN || '';
        this.apiUrl = process.env.BALE_BOT_API_URL || 'https://tapi.bale.ai';
        this.enabled = process.env.BALE_BOT_ENABLED === 'true';
        this.siteUrl = 'https://raaviiplatform.com';
        if (this.enabled && this.token) {
            const secret = process.env.BALE_BOT_WEBHOOK_SECRET || '';
            const url = `${this.siteUrl}/api/bale/webhook/${secret}`;
            this.setWebhook(url).then(r => {
                if (r?.result)
                    this.logger.log(`✅ Bale webhook set: ${url}`);
            }).catch(() => { });
        }
    }
    get api() { return `${this.apiUrl}/bot${this.token}`; }
    normalizePhone(phone) {
        let p = String(phone).replace(/\D/g, '');
        if (p.startsWith('98'))
            return p;
        if (p.startsWith('0'))
            return '98' + p.substring(1);
        if (p.startsWith('9') && p.length === 10)
            return '98' + p;
        return p;
    }
    async getChatId(phone) {
        const norm = this.normalizePhone(phone);
        const rows = await this.ds.query('SELECT chat_id FROM bale_user_chats WHERE phone=$1 LIMIT 1', [norm]);
        return rows?.[0]?.chat_id || null;
    }
    async getPhoneByChat(chatId) {
        const rows = await this.ds.query('SELECT phone FROM bale_user_chats WHERE chat_id=$1::bigint LIMIT 1', [String(chatId)]);
        return rows?.[0]?.phone || null;
    }
    async getUserByChatId(chatId) {
        const rows = await this.ds.query(`
      SELECT u.id, u.name, u."mobileNumber" as phone
      FROM bale_user_chats b
      JOIN users u ON u."mobileNumber" = '0' || SUBSTRING(b.phone, 3)
      WHERE b.chat_id = $1::bigint LIMIT 1
    `, [String(chatId)]);
        return rows?.[0] || null;
    }
    // ── ارسال پیام ─────────────────────────────────────────────────────
    async sendMessage(chatId, text, extra = {}) {
        if (!this.enabled || !this.token)
            return false;
        try {
            const res = await fetch(`${this.api}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: String(chatId), text, parse_mode: 'Markdown', ...extra }),
            });
            const data = await res.json();
            if (!data.ok)
                this.logger.warn(`Bale send failed: ${JSON.stringify(data)}`);
            return !!data.ok;
        }
        catch (e) {
            this.logger.error(`Bale exception: ${e.message}`);
            return false;
        }
    }
    async answerCallback(callbackQueryId) {
        await fetch(`${this.api}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId }),
        }).catch(() => { });
    }
    async sendToPhone(phone, text, extra) {
        const chatId = await this.getChatId(phone);
        if (!chatId)
            return false;
        return this.sendMessage(chatId, text, extra);
    }
    // ── منوی اصلی ──────────────────────────────────────────────────────
    async showMainMenu(chatId) {
        await this.sendMessage(chatId, '📋 *منوی راوی*\n\nیکی از گزینه‌ها را انتخاب کنید:', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📅 رویدادها', callback_data: 'events' },
                        { text: '🏥 روانشناسان', callback_data: 'psychologists' },
                    ],
                    [
                        { text: '🧪 تست‌های من', callback_data: 'tests' },
                        { text: '📋 رزروهای من', callback_data: 'bookings' },
                    ],
                    [
                        { text: '👤 وضعیت حساب', callback_data: 'status' },
                        { text: '🌐 ورود به سایت', url: this.siteUrl + '/dashboard' },
                    ],
                ],
            },
        });
    }
    // ── لیست رویدادها ──────────────────────────────────────────────────
    async sendEventsList(chatId) {
        const events = await this.ds.query(`
      SELECT id, title, start_date, city, is_online, price, capacity, current_bookings
      FROM events
      WHERE is_active = true AND start_date > NOW()
      ORDER BY start_date ASC LIMIT 5
    `).catch(() => []);
        if (!events?.length) {
            await this.sendMessage(chatId, '📅 در حال حاضر رویداد فعالی وجود ندارد.');
            return;
        }
        let text = '📅 *رویدادهای فعال راوی*\n\n';
        events.forEach((e, i) => {
            const date = e.start_date ? new Date(e.start_date).toLocaleDateString('fa-IR') : '';
            const remaining = e.capacity - (e.current_bookings || 0);
            const price = e.price ? Number(e.price / 10).toLocaleString() + ' ت' : 'رایگان';
            const status = remaining <= 0 ? '🔴 تکمیل' : `🟢 ${remaining} جا`;
            text += `*${i + 1}\. ${e.title}*\n`;
            text += `📍 ${e.is_online ? 'آنلاین' : e.city || ''}  📅 ${date}\n`;
            text += `💰 ${price}  ${status}\n`;
            text += `[ثبت‌نام](${this.siteUrl}/events/${e.id})\n\n`;
        });
        const buttons = events.map((e) => [
            { text: '🔗 ' + e.title.slice(0, 25), url: `${this.siteUrl}/events/${e.id}` }
        ]);
        buttons.push([{ text: '📅 همه رویدادها', url: `${this.siteUrl}/events` }]);
        await this.sendMessage(chatId, text, {
            reply_markup: { inline_keyboard: buttons }
        });
    }
    // ── لیست روانشناسان ────────────────────────────────────────────────
    async sendPsychologistsList(chatId) {
        const therapists = await this.ds.query(`
      SELECT tp.id, p.nameFromIrimc as name, tp.specialties,
             tp.rating, tp.price_per_session, tp.city
      FROM psychologist_profiles p
      JOIN therapist_profiles tp ON tp.user_id = p.user_id
      WHERE p.verification_status = 'approved' AND tp.is_active = true
      LIMIT 5
    `).catch(() => []);
        if (!therapists?.length) {
            await this.sendMessage(chatId, '🏥 *روانشناسان راوی*\n\n' +
                'برای مشاهده لیست کامل روانشناسان به سایت راوی مراجعه کنید.', { reply_markup: { inline_keyboard: [[
                            { text: '🏥 مشاهده روانشناسان', url: `${this.siteUrl}/dashboard/my-therapist` }
                        ]] } });
            return;
        }
        let text = '🏥 *روانشناسان راوی*\n\n';
        therapists.forEach((t, i) => {
            const price = t.price_per_session ? Number(t.price_per_session / 10).toLocaleString() + ' ت' : '';
            const rating = t.rating ? '⭐ ' + Number(t.rating).toFixed(1) : '';
            const specs = Array.isArray(t.specialties) ? t.specialties.slice(0, 2).join('، ') : '';
            text += `*${i + 1}\. ${t.name || 'روانشناس'}*\n`;
            text += `🎓 ${specs}  ${rating}\n`;
            if (price)
                text += `💰 ${price} هر جلسه\n`;
            text += `[رزرو جلسه](${this.siteUrl}/dashboard/my-therapist/ham-ravan/${t.id})\n\n`;
        });
        await this.sendMessage(chatId, text, {
            reply_markup: { inline_keyboard: [[
                        { text: '🏥 مشاهده همه', url: `${this.siteUrl}/dashboard/my-therapist` }
                    ]] }
        });
    }
    // ── لیست تست‌ها ────────────────────────────────────────────────────
    async sendTestsList(chatId) {
        const user = await this.getUserByChatId(chatId);
        if (!user) {
            await this.sendMessage(chatId, '❌ ابتدا وارد سایت شوید.');
            return;
        }
        const done = await this.ds.query('SELECT DISTINCT test_name FROM test_results WHERE user_id=$1', [user.id]).catch(() => []);
        const doneSet = new Set(done.map((r) => r.test_name));
        const TESTS = [
            { id: 'raavi_matching_basis_v1', name: 'تیپ شخصیتی MBTI', core: true },
            { id: 'neo_ffi', name: 'پنج عامل NEO', core: true },
            { id: 'ecr_r', name: 'سبک دلبستگی ECR-R', core: true },
            { id: 'erq', name: 'تنظیم هیجان ERQ', core: true },
            { id: 'iri', name: 'همدلی IRI', core: true },
            { id: 'gottman', name: 'الگوی رابطه Gottman', core: false },
            { id: 'phq9', name: 'سلامت روان PHQ-9', core: false },
            { id: 'gad7', name: 'اضطراب GAD-7', core: false },
            { id: 'love_languages', name: 'زبان محبت', core: false },
        ];
        const coreTests = TESTS.filter(t => t.core);
        const coreDone = coreTests.filter(t => doneSet.has(t.id)).length;
        let text = `🧪 *تست‌های روان‌سنجی ${user.name}*\n\n`;
        text += `📊 تست‌های هسته‌ای: ${coreDone}/${coreTests.length} تکمیل\n\n`;
        text += '*تست‌های اصلی:*\n';
        TESTS.forEach(t => {
            const isDone = doneSet.has(t.id);
            const icon = isDone ? '✅' : '⭕';
            const core = t.core ? '⭐' : '';
            text += `${icon} ${core} ${t.name}\n`;
        });
        const buttons = TESTS.filter(t => !doneSet.has(t.id)).slice(0, 3).map(t => [
            { text: '▶️ ' + t.name, url: `${this.siteUrl}/dashboard/tests/${t.id}` }
        ]);
        buttons.push([{ text: '🧪 همه تست‌ها', url: `${this.siteUrl}/dashboard/tests` }]);
        await this.sendMessage(chatId, text, {
            reply_markup: { inline_keyboard: buttons }
        });
    }
    // ── رزروهای من ─────────────────────────────────────────────────────
    async sendBookingsList(chatId) {
        const user = await this.getUserByChatId(chatId);
        if (!user) {
            await this.sendMessage(chatId, '❌ ابتدا وارد سایت شوید.');
            return;
        }
        const bookings = await this.ds.query(`
      SELECT b.id, b.status, b.payment_status, b.created_at,
             b.cancellation_reason, b.confirmed_at, b.amount_paid,
             e.title, e.start_date, e.city, e.is_online
      FROM bookings b
      LEFT JOIN events e ON e.id = b.event_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC LIMIT 5
    `, [user.id]).catch(() => []);
        if (!bookings?.length) {
            await this.sendMessage(chatId, '📋 *رزروهای شما*\n\nهنوز رزروی ندارید.', { reply_markup: { inline_keyboard: [[
                            { text: '📅 مشاهده رویدادها', url: `${this.siteUrl}/events` }
                        ]] } });
            return;
        }
        const STATUS = {
            confirmed: '✅ تأیید شده',
            pending: '⏳ در انتظار',
            cancelled: '❌ لغو شده',
            attended: '🎯 شرکت کرده',
            completed: '✅ تکمیل شده',
        };
        const PAYMENT = {
            paid: '💚 پرداخت موفق',
            pending: '💛 در انتظار پرداخت',
            failed: '🔴 پرداخت ناموفق',
            refunded: '🔵 بازگشت وجه',
        };
        let text = `📋 *رزروهای ${user.name}*\n\n`;
        bookings.forEach((b, i) => {
            const status = STATUS[b.status] || b.status;
            const payment = PAYMENT[b.payment_status] || b.payment_status;
            const date = b.start_date ? new Date(b.start_date).toLocaleDateString('fa-IR') : '';
            const amount = b.amount_paid ? Number(b.amount_paid / 10).toLocaleString() + ' ت' : '';
            text += `*${i + 1}\. ${b.title || 'رزرو'}*\n`;
            text += `📍 ${b.is_online ? 'آنلاین' : b.city || ''}  📅 ${date}\n`;
            text += `${status}  ${payment}\n`;
            if (b.status === 'confirmed' && b.confirmed_at) {
                const confirmDate = new Date(b.confirmed_at).toLocaleDateString('fa-IR');
                text += `✅ تأیید شده در: ${confirmDate}\n`;
                if (amount)
                    text += `💰 مبلغ: ${amount}\n`;
            }
            if (b.status === 'cancelled') {
                const reason = b.cancellation_reason;
                if (reason)
                    text += `📝 دلیل لغو: ${reason}\n`;
                else
                    text += `📝 لغو توسط کاربر\n`;
            }
            if (b.payment_status === 'pending') {
                text += `⚠️ برای تکمیل پرداخت اقدام کنید\n`;
            }
            text += '\n';
        });
        await this.sendMessage(chatId, text, {
            reply_markup: { inline_keyboard: [[
                        { text: '📋 مشاهده همه رزروها', url: `${this.siteUrl}/dashboard/sessions` }
                    ]] }
        });
    }
    // ── OTP ────────────────────────────────────────────────────────────
    async sendOtp(phone, code) {
        if (!this.enabled || !this.token)
            return { sent: false, reason: 'disabled' };
        const chatId = await this.getChatId(phone);
        if (!chatId)
            return { sent: false, reason: 'not_connected' };
        const text = '🔐 *کد ورود راوی*\n\n' +
            'کد یکبار مصرف: `' + code + '`\n\n' +
            '⏱ ۵ دقیقه اعتبار دارد\n' +
            '🚫 این کد را با کسی به اشتراک نگذارید';
        const sent = await this.sendMessage(chatId, text);
        return { sent, reason: sent ? undefined : 'send_failed' };
    }
    // ── سایر send methods ───────────────────────────────────────────────
    async sendEventRecommendations(phone, events) {
        if (!events?.length)
            return false;
        let text = '🎯 *رویدادهای پیشنهادی راوی*\n\n';
        events.slice(0, 3).forEach((e, i) => {
            const emoji = ['🥇', '🥈', '🥉'][i];
            text += `${emoji} *${e.title}*\n`;
            text += `📅 ${e.date || ''}  📍 ${e.location || 'آنلاین'}\n`;
            if (e.price)
                text += `💰 ${Number(e.price / 10).toLocaleString()} تومان\n`;
            text += `[رزرو](${this.siteUrl}/events/${e.id})\n\n`;
        });
        return this.sendToPhone(phone, text);
    }
    async sendPsychologistRecommendations(phone, therapists) {
        if (!therapists?.length)
            return false;
        let text = '🏥 *روانشناسان پیشنهادی*\n\n';
        therapists.slice(0, 3).forEach((t, i) => {
            text += `${['⭐⭐⭐', '⭐⭐', '⭐'][i]} *${t.name || t.nameFromIrimc}*\n`;
            text += `🎓 ${t.specialty || ''}\n`;
            text += `[رزرو جلسه](${this.siteUrl}/dashboard/my-therapist/ham-ravan/${t.id})\n\n`;
        });
        return this.sendToPhone(phone, text);
    }
    async sendEventReminder(phone, booking) {
        const text = '🗓️ *یادآوری رویداد*\n\n' +
            `*${booking.title}*\n` +
            `📅 ${booking.date || ''}  ⏰ ${booking.time || ''}\n` +
            `📍 ${booking.location || 'آنلاین'}\n\n` +
            `[مشاهده جلسه](${this.siteUrl}/dashboard/sessions)`;
        return this.sendToPhone(phone, text);
    }
    async sendAbandonedPaymentReminder(phone, booking) {
        const text = '⚠️ *پرداخت ناتمام*\n\n' +
            `*${booking.title || 'رویداد راوی'}*\n\n` +
            '⏳ جای شما *۳۰ دقیقه* دیگر آزاد می‌شود!\n\n' +
            `[تکمیل پرداخت](${this.siteUrl}/dashboard/sessions)`;
        return this.sendToPhone(phone, text);
    }
    async sendCapacityReachedNotification(phone, event) {
        const text = '🎉 *رویداد به حد نصاب رسید!*\n\n' +
            `*${event.title}*\n` +
            `📅 ${event.date || ''}  📍 ${event.location || 'آنلاین'}\n\n` +
            `[تکمیل پرداخت](${this.siteUrl}/events/${event.id})`;
        return this.sendToPhone(phone, text);
    }
    async sendPaymentReceipt(phone, payment) {
        const refCode = payment.refCode || (payment.id || '').slice(0, 8).toUpperCase();
        const text = '✅ *فاکتور پرداخت راوی*\n\n' +
            '━━━━━━━━━━━━\n' +
            `📋 شماره: \`${refCode}\`\n` +
            `📌 ${payment.title || 'رویداد راوی'}\n` +
            `💰 ${payment.amount ? Number(payment.amount / 10).toLocaleString() + ' تومان' : ''}\n` +
            '✅ پرداخت موفق\n' +
            '━━━━━━━━━━━━\n' +
            `[جلسات من](${this.siteUrl}/dashboard/sessions)`;
        return this.sendToPhone(phone, text);
    }
    async sendGroupMatchResult(phone, group, event) {
        const score = Math.round(group.avgCompatibilityScore || group.avgScore || 0);
        const text = '🎯 *گروه شما آماده شد!*\n\n' +
            `⭐ سازگاری: *${score}٪*\n` +
            `*${event.title}*\n\n` +
            `[مشاهده جلسه](${this.siteUrl}/dashboard/sessions)`;
        return this.sendToPhone(phone, text);
    }
    // ── پردازش webhook ──────────────────────────────────────────────────
    async handleUpdate(update) {
        // callback_query — دکمه‌های inline
        if (update?.callback_query) {
            const cq = update.callback_query;
            const chatId = cq.message?.chat?.id || cq.from?.id;
            const data = cq.data || '';
            await this.answerCallback(cq.id);
            if (data === 'events') {
                await this.sendEventsList(chatId);
                return;
            }
            if (data === 'psychologists') {
                await this.sendPsychologistsList(chatId);
                return;
            }
            if (data === 'tests') {
                await this.sendTestsList(chatId);
                return;
            }
            if (data === 'bookings') {
                await this.sendBookingsList(chatId);
                return;
            }
            if (data === 'status') {
                await this.sendStatus(chatId);
                return;
            }
            if (data === 'menu') {
                await this.showMainMenu(chatId);
                return;
            }
            return;
        }
        const msg = update?.message;
        if (!msg)
            return;
        const chatId = msg.chat?.id;
        const text = (msg.text || '').trim();
        // contact sharing
        if (msg.contact?.phone_number) {
            const phone = this.normalizePhone(msg.contact.phone_number);
            const firstName = msg.contact.first_name || '';
            const lastName = msg.contact.last_name || '';
            await this.ds.query(`INSERT INTO bale_user_chats (phone, chat_id, first_name, last_name, updated_at)
         VALUES ($1, $2::bigint, $3, $4, NOW())
         ON CONFLICT (phone) DO UPDATE
         SET chat_id=$2::bigint, first_name=$3, last_name=$4, updated_at=NOW()`, [phone, String(chatId), firstName, lastName]);
            await this.sendMessage(chatId, '✅ *شماره شما ثبت شد!*\n\n' +
                'از این پس کدهای OTP و اعلان‌ها اینجا می‌رسند.', { reply_markup: { remove_keyboard: true } });
            await new Promise(r => setTimeout(r, 500));
            await this.showMainMenu(chatId);
            return;
        }
        // /start
        if (text.startsWith('/start')) {
            const param = text.split(' ')[1] || '';
            if (param.startsWith('otp_')) {
                const parts = param.split('_');
                const phone = parts[1];
                if (phone?.length >= 10) {
                    const normPhone = this.normalizePhone(phone);
                    await this.ds.query(`INSERT INTO bale_user_chats (phone, chat_id, updated_at)
             VALUES ($1, $2::bigint, NOW())
             ON CONFLICT (phone) DO UPDATE SET chat_id=$2::bigint, updated_at=NOW()`, [normPhone, String(chatId)]);
                    const otpRow = await this.ds.query('SELECT code FROM otps WHERE mobile_number=$1 ORDER BY id DESC LIMIT 1', [phone]).catch(() => []);
                    if (otpRow?.[0]?.code) {
                        await this.sendMessage(chatId, '✅ *متصل شدید!*\n\n' +
                            '🔐 کد ورود: `' + otpRow[0].code + '`\n' +
                            '⏱ ۵ دقیقه اعتبار دارد');
                    }
                    else {
                        await this.sendMessage(chatId, '✅ *به راوی متصل شدید!*\n\n' +
                            'کدهای ورود بعد از این اینجا می‌رسند.');
                    }
                    await this.showMainMenu(chatId);
                    return;
                }
            }
            // deep link: ورود به گروه بله رویداد
            if (param.startsWith('event_GROUP_')) {
                const eventId = param.replace('event_GROUP_', '');
                const phone = await this.getPhoneByChat(chatId);
                if (!phone) {
                    await this.sendMessage(chatId, '❌ ابتدا شماره موبایل خود را به بات ارسال کنید.', { reply_markup: { keyboard: [[{ text: '📱 ارسال شماره من', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } });
                    return;
                }
                // چک رزرو معتبر
                const booking = await this.ds.query(`
          SELECT b.id, u.id as user_id FROM bookings b
          JOIN users u ON u.id=b.user_id
          WHERE b.event_id=$1 AND u.phone_number='0'||SUBSTRING(b.phone::text,3)
          AND b.status='confirmed' LIMIT 1
        `, [eventId]).catch(() => []);
                // ثبت‌نام با BaleGroupService
                try {
                    await this.ds.query(`
            INSERT INTO event_bale_registrations (event_id, user_id, phone, chat_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (event_id, phone) DO UPDATE SET chat_id=$4
          `, [eventId, null, phone, String(chatId)]);
                }
                catch { }
                const evInfo = await this.ds.query('SELECT title, end_date, bale_group_link FROM events WHERE id=$1', [eventId]);
                const ev = evInfo?.[0];
                if (ev?.bale_group_link) {
                    await this.sendMessage(chatId, `🎉 *لینک گروه بله آماده‌ست!*

*${ev.title}*

🔗 ${ev.bale_group_link}`);
                }
                else {
                    await this.sendMessage(chatId, `✅ *ثبت‌نام گروه بله*

*${ev?.title || 'رویداد'}*

` +
                        `شما ثبت شدید. پس از برگزاری رویداد و تکمیل گروه‌بندی، لینک گروه برای شما ارسال می‌شود.

` +
                        `⏰ صبور باشید.`);
                }
                return;
            }
            // start بدون param
            const existingPhone = await this.getPhoneByChat(chatId);
            if (existingPhone) {
                await this.sendMessage(chatId, '👋 *خوش برگشتی به راوی!*\n\n' +
                    'شماره متصل: ' + ('0' + existingPhone.substring(2)));
                await this.showMainMenu(chatId);
                return;
            }
            await this.sendMessage(chatId, '🌟 *به ربات راوی خوش آمدید!*\n\n' +
                'برای دریافت OTP و اعلان‌ها شماره موبایلتان را ارسال کنید:', {
                reply_markup: {
                    keyboard: [[{ text: '📱 ارسال شماره من', request_contact: true }]],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                }
            });
            return;
        }
        // /menu یا منو
        if (text.startsWith('/menu') || text === 'منو') {
            await this.showMainMenu(chatId);
            return;
        }
        if (text.startsWith('/status')) {
            await this.sendStatus(chatId);
            return;
        }
        if (text.startsWith('/events') || text === 'رویدادها') {
            await this.sendEventsList(chatId);
            return;
        }
        if (text.startsWith('/tests') || text === 'تست‌ها') {
            await this.sendTestsList(chatId);
            return;
        }
        if (text.startsWith('/bookings') || text === 'رزروها') {
            await this.sendBookingsList(chatId);
            return;
        }
        // پیام عمومی
        await this.sendMessage(chatId, '💬 برای دیدن منو: /menu', { reply_markup: { inline_keyboard: [[
                        { text: '📋 منو', callback_data: 'menu' }
                    ]] } });
    }
    async sendStatus(chatId) {
        const phone = await this.getPhoneByChat(chatId);
        if (!phone) {
            await this.sendMessage(chatId, '❌ ابتدا شماره موبایل خود را ارسال کنید.');
            return;
        }
        const user = await this.getUserByChatId(chatId);
        const local = '0' + phone.substring(2);
        const testCount = user ? (await this.ds.query('SELECT COUNT(DISTINCT test_name) as c FROM test_results WHERE user_id=$1', [user.id]).catch(() => [{ c: 0 }]))[0]?.c || 0 : 0;
        await this.sendMessage(chatId, '👤 *وضعیت حساب*\n\n' +
            `نام: ${user?.name || 'ثبت نشده'}\n` +
            `موبایل: ${local}\n` +
            `تست‌های انجام‌شده: ${testCount}\n\n` +
            `[ورود به پنل](${this.siteUrl}/dashboard)`, { reply_markup: { inline_keyboard: [[
                        { text: '📋 منو', callback_data: 'menu' }
                    ]] } });
    }
    async notifyGroups(eventId, groups) {
        for (const group of groups) {
            for (const userId of (group.memberIds || [])) {
                const rows = await this.ds.query('SELECT b.phone FROM bale_user_chats b JOIN users u ON u.id=$1 WHERE b.chat_id IS NOT NULL LIMIT 1', [userId]).catch(() => []);
                if (rows?.[0]?.phone) {
                    await this.sendGroupMatchResult(rows[0].phone, group, { title: group.eventTitle });
                }
            }
        }
    }
    async notifyAdmin(message) {
        const admins = await this.ds.query("SELECT b.chat_id FROM bale_user_chats b JOIN users u ON u.id = b.user_id WHERE u.role='admin'").catch(() => []);
        for (const a of admins) {
            await this.sendMessage(a.chat_id, message);
        }
    }
    async getWebhookInfo() {
        const res = await fetch(`${this.api}/getWebhookInfo`);
        return res.json();
    }
    async setWebhook(url) {
        const res = await fetch(`${this.api}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
        return res.json();
    }
};
exports.BaleBotService = BaleBotService;
exports.BaleBotService = BaleBotService = BaleBotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], BaleBotService);
