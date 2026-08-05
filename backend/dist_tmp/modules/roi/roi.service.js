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
var RoiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("../events/entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const feedback_entity_1 = require("../feedbacks/entities/feedback.entity");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
let RoiService = RoiService_1 = class RoiService {
    constructor(eventRepo, bookingRepo, feedbackRepo, spRepo) {
        this.eventRepo = eventRepo;
        this.bookingRepo = bookingRepo;
        this.feedbackRepo = feedbackRepo;
        this.spRepo = spRepo;
        this.logger = new common_1.Logger(RoiService_1.name);
    }
    async getEventROI(eventId) {
        const event = await this.eventRepo.findOne({ where: { id: eventId } });
        if (!event)
            throw new Error('رویداد یافت نشد');
        const bookings = await this.bookingRepo.find({ where: { event_id: eventId } });
        const paid = bookings.filter(b => b.payment_status === 'paid');
        const attended = paid.filter(b => b.attended);
        const totalRevenue = paid.reduce((s, b) => s + Number(b.amount_paid || event.price || 0), 0);
        const venueCost = Number(event.venue_cost || 0);
        const netProfit = totalRevenue - venueCost;
        const roiPercent = venueCost > 0 ? Math.round((netProfit / venueCost) * 100) : 100;
        const feedbacks = await this.feedbackRepo.find({ where: { event_id: eventId } });
        const avgFeedbackScore = feedbacks.length > 0 ? Math.round(feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.length * 10) / 10 : 0;
        let returnCount = 0;
        for (const b of attended) {
            const c = await this.bookingRepo.count({ where: { user_id: b.user_id } });
            if (c > 1)
                returnCount++;
        }
        const attendanceRate = paid.length > 0 ? Math.round((attended.length / paid.length) * 100) : 0;
        const returnRate = attended.length > 0 ? Math.round((returnCount / attended.length) * 100) : 0;
        const successScore = Math.round(attendanceRate * 0.4 + (avgFeedbackScore / 5 * 100) * 0.3 + returnRate * 0.2 + Math.min(Math.max(roiPercent, 0), 100) * 0.1);
        return { eventId, title: event.title, date: new Date(event.start_date).toLocaleDateString('fa-IR'), totalRevenue, venueCost, netProfit, roiPercent, totalBooked: paid.length, totalAttended: attended.length, attendanceRate, avgFeedbackScore, returnRate, successScore };
    }
    async getMonthlyROI(months = 3) {
        const now = new Date();
        const monthly = [];
        for (let i = months - 1; i >= 0; i--) {
            const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const events = await this.eventRepo.find({ where: { start_date: (0, typeorm_2.Between)(s, e), is_active: true } });
            let revenue = 0, cost = 0, scores = [], att = [];
            for (const ev of events) {
                try {
                    const r = await this.getEventROI(ev.id);
                    revenue += r.totalRevenue;
                    cost += r.venueCost;
                    scores.push(r.successScore);
                    att.push(r.attendanceRate);
                }
                catch { }
            }
            monthly.push({ label: s.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' }), revenue, cost, profit: revenue - cost, avgSuccessScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0, eventCount: events.length, attendanceRate: att.length > 0 ? Math.round(att.reduce((a, b) => a + b, 0) / att.length) : 0 });
        }
        const tot = monthly.reduce((a, m) => ({ r: a.r + m.revenue, c: a.c + m.cost, p: a.p + m.profit, s: a.s + m.avgSuccessScore }), { r: 0, c: 0, p: 0, s: 0 });
        const profiles = await this.spRepo.find({ take: 500 });
        const avgReturnRate = profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + (p.return_rate || 0), 0) / profiles.length * 100) : 0;
        return { monthly, summary: { totalRevenue: tot.r, totalCost: tot.c, totalProfit: tot.p, avgSuccessScore: months > 0 ? Math.round(tot.s / months) : 0, avgReturnRate } };
    }
    async analyzeEventWithAI(eventId) {
        const roi = await this.getEventROI(eventId);
        const bookings = await this.bookingRepo.find({ where: { event_id: eventId, payment_status: 'paid' } });
        const absentIds = [];
        for (const b of bookings.filter(x => !x.attended)) {
            const c = await this.bookingRepo.count({ where: { user_id: b.user_id, payment_status: 'paid', attended: false } });
            if (c >= 2)
                absentIds.push(b.user_id);
        }
        let insight = '';
        const recs = [];
        if (roi.successScore >= 80) {
            insight = `همنشینی "${roi.title}" با موفقیت بالا برگزار شد (حضور ${roi.attendanceRate}%, بازخورد ${roi.avgFeedbackScore}/5).`;
            recs.push('برنامه‌ریزی رویداد مشابه توصیه می‌شود.');
        }
        else if (roi.successScore >= 60) {
            insight = `همنشینی "${roi.title}" عملکرد متوسطی داشت.`;
            recs.push('بررسی علت غیبت با ارسال نظرسنجی پیشنهاد می‌شود.');
        }
        else {
            insight = `همنشینی "${roi.title}" نیاز به بازبینی دارد (حضور ${roi.attendanceRate}%).`;
            recs.push('بازنگری در زمان‌بندی یا مکان ضروری است.');
        }
        if (roi.roiPercent < 0)
            recs.push('هزینه کافه بیشتر از درآمد است — مذاکره برای تخفیف توصیه می‌شود.');
        if (roi.returnRate < 30)
            recs.push('نرخ بازگشت کاربران پایین است — ارسال پیشنهاد ویژه توصیه می‌شود.');
        return { roi, aiInsight: insight, recommendations: recs, bannedUsers: absentIds };
    }
};
exports.RoiService = RoiService;
exports.RoiService = RoiService = RoiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(2, (0, typeorm_1.InjectRepository)(feedback_entity_1.Feedback)),
    __param(3, (0, typeorm_1.InjectRepository)(smart_profile_entity_1.SmartProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RoiService);
