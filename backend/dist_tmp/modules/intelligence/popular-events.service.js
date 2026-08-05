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
var PopularEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopularEventsService = void 0;
/**
 * سرویس محبوب‌ترین برنامه‌ها — لایه ۹ داشبورد
 * امتیاز ترکیبی = 40% نظر + 40% حضور + 20% رزرو
 */
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("../events/entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const TYPE_LABELS = {
    hamneshin: 'همنشینی', hambazi: 'هم‌بازی', hamsohbat: 'هم‌صحبت',
    hampa: 'هم‌پا', hamteymi: 'هم‌تیمی', hamamooz: 'هم‌آموز',
};
let PopularEventsService = PopularEventsService_1 = class PopularEventsService {
    constructor(eventRepo, bookingRepo) {
        this.eventRepo = eventRepo;
        this.bookingRepo = bookingRepo;
        this.logger = new common_1.Logger(PopularEventsService_1.name);
    }
    async getPopularPrograms(limit = 10) {
        const now = new Date();
        const events = (await this.eventRepo.find({ where: { is_active: true }, order: { start_date: 'DESC' } }))
            .filter(e => new Date(e.end_date) < now);
        if (!events.length)
            return { topEvents: [], topEventTypes: [], topCities: [], summary: { totalEventsRated: 0, overallAvgRating: 0, mostPopularType: '-', mostPopularCity: '-' } };
        const stats = await Promise.all(events.map(async (ev) => {
            const bookings = await this.bookingRepo.find({ where: { event_id: ev.id } });
            const attended = bookings.filter(b => b.attended).length;
            const rated = bookings.filter(b => b.rating > 0);
            const avgRating = rated.length ? rated.reduce((s, b) => s + (b.rating || 0), 0) / rated.length : 0;
            const attRate = bookings.length ? attended / bookings.length : 0;
            const bookScore = Math.min(bookings.length / ev.capacity, 1);
            const popularity = (avgRating / 5 * 40) + (attRate * 40) + (bookScore * 20);
            return {
                eventId: ev.id, title: ev.title, eventType: ev.event_type || 'general',
                city: ev.city || '-', startDate: ev.start_date,
                totalRatings: rated.length, avgRating: Math.round(avgRating * 10) / 10,
                attendanceRate: Math.round(attRate * 100), popularityScore: Math.round(popularity),
            };
        }));
        const sorted = stats.filter(s => s.totalRatings > 0 || s.attendanceRate > 0)
            .sort((a, b) => b.popularityScore - a.popularityScore);
        const typeAgg = {};
        const cityAgg = {};
        for (const s of stats) {
            const t = s.eventType;
            if (!typeAgg[t])
                typeAgg[t] = { r: 0, c: 0, n: 0 };
            typeAgg[t].n++;
            if (s.avgRating > 0) {
                typeAgg[t].r += s.avgRating;
                typeAgg[t].c++;
            }
            const cy = s.city;
            if (!cityAgg[cy])
                cityAgg[cy] = { r: 0, c: 0, n: 0 };
            cityAgg[cy].n++;
            if (s.avgRating > 0) {
                cityAgg[cy].r += s.avgRating;
                cityAgg[cy].c++;
            }
        }
        const topEventTypes = Object.entries(typeAgg)
            .map(([t, v]) => ({ type: t, label: TYPE_LABELS[t] || t, avgRating: v.c ? Math.round(v.r / v.c * 10) / 10 : 0, count: v.n }))
            .sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);
        const topCities = Object.entries(cityAgg).filter(([c]) => c !== '-')
            .map(([c, v]) => ({ city: c, avgRating: v.c ? Math.round(v.r / v.c * 10) / 10 : 0, count: v.n }))
            .sort((a, b) => b.avgRating - a.avgRating).slice(0, 5);
        const overallAvg = sorted.length ? sorted.reduce((s, e) => s + e.avgRating, 0) / sorted.length : 0;
        return {
            topEvents: sorted.slice(0, limit), topEventTypes, topCities,
            summary: {
                totalEventsRated: stats.filter(s => s.totalRatings > 0).length,
                overallAvgRating: Math.round(overallAvg * 10) / 10,
                mostPopularType: topEventTypes[0]?.label || '-',
                mostPopularCity: topCities[0]?.city || '-',
            },
        };
    }
    async rateEvent(bookingId, userId, rating, comment) {
        if (rating < 1 || rating > 5)
            throw new Error('امتیاز باید ۱ تا ۵ باشد');
        const b = await this.bookingRepo.findOne({ where: { id: bookingId, user_id: userId } });
        if (!b)
            throw new Error('رزرو یافت نشد');
        if (!b.attended)
            throw new Error('فقط شرکت‌کنندگان می‌توانند امتیاز دهند');
        await this.bookingRepo.update(bookingId, { rating, rating_comment: comment, rated_at: new Date() });
    }
    async getWeeklyInsightData() {
        const oneWeekAgo = new Date(Date.now() - 7 * 86400_000);
        const newBookings = await this.bookingRepo.count({ where: { status: 'confirmed' } });
        const popular = await this.getPopularPrograms(1);
        return { newBookings, avgRating: popular.summary.overallAvgRating, popularProgram: popular.topEvents[0]?.title || '-' };
    }
};
exports.PopularEventsService = PopularEventsService;
exports.PopularEventsService = PopularEventsService = PopularEventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PopularEventsService);
