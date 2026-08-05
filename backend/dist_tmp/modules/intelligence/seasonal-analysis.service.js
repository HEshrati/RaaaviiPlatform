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
var SeasonalAnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonalAnalysisService = void 0;
/**
 * سرویس تحلیل فصلی — لایه ۷ تحلیل رفتاری
 * بهترین ساعت‌های برگزاری در هر فصل تحلیل می‌شود
 */
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const event_entity_1 = require("../events/entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const SEASON_LABELS = { spring: 'بهار', summer: 'تابستان', fall: 'پاییز', winter: 'زمستان' };
const SEASON_MONTHS = { spring: [3, 5], summer: [6, 8], fall: [9, 11], winter: [12, 2] };
let SeasonalAnalysisService = SeasonalAnalysisService_1 = class SeasonalAnalysisService {
    constructor(eventRepo, bookingRepo) {
        this.eventRepo = eventRepo;
        this.bookingRepo = bookingRepo;
        this.logger = new common_1.Logger(SeasonalAnalysisService_1.name);
    }
    async runSeasonalAnalysis() {
        const { season, year } = this.getLastSeason();
        this.logger.log(`��� تحلیل فصل ${SEASON_LABELS[season]} ${year}...`);
        return this.analyzeSeasonalTimeslots(season, year);
    }
    getCurrentSeason() {
        const m = new Date().getMonth() + 1;
        const season = m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'fall' : 'winter';
        return { season, year: new Date().getFullYear() };
    }
    getLastSeason() {
        const order = ['spring', 'summer', 'fall', 'winter'];
        const { season, year } = this.getCurrentSeason();
        const idx = order.indexOf(season);
        const last = order[idx === 0 ? 3 : idx - 1];
        return { season: last, year: last === 'winter' && season === 'spring' ? year - 1 : year };
    }
    async analyzeCurrentSeason() {
        const { season, year } = this.getCurrentSeason();
        return this.analyzeSeasonalTimeslots(season, year);
    }
    async compareSeasons(year) {
        return Promise.all(['spring', 'summer', 'fall', 'winter'].map(s => this.analyzeSeasonalTimeslots(s, year)));
    }
    async analyzeSeasonalTimeslots(season, year) {
        const [sm, em] = SEASON_MONTHS[season];
        const startDate = new Date(year, sm - 1, 1);
        const endDate = sm > em ? new Date(year, 11, 31, 23, 59, 59) : new Date(year, em, 0, 23, 59, 59);
        const events = await this.eventRepo.find({
            where: { start_date: (0, typeorm_2.Between)(startDate, endDate), is_active: true },
            relations: ['bookings'],
        });
        if (!events.length)
            return {
                season, seasonLabel: SEASON_LABELS[season], year, totalEvents: 0,
                bestTimeSlots: [], bestDays: [], insights: ['داده کافی وجود ندارد'],
            };
        const dayNames = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
        const hourStats = {};
        const dayStats = {};
        for (const ev of events) {
            const d = new Date(ev.start_date);
            const h = d.getHours();
            const day = dayNames[d.getDay()];
            const attended = ev.bookings?.filter(b => b.attended).length || 0;
            const total = ev.bookings?.length || 0;
            if (!hourStats[h])
                hourStats[h] = { count: 0, attended: 0, total: 0 };
            hourStats[h].count++;
            hourStats[h].attended += attended;
            hourStats[h].total += total;
            if (!dayStats[day])
                dayStats[day] = { count: 0, attended: 0, total: 0 };
            dayStats[day].count++;
            dayStats[day].attended += attended;
            dayStats[day].total += total;
        }
        const bestTimeSlots = Object.entries(hourStats)
            .map(([h, s]) => ({ hour: +h, label: `${h}:00 - ${+h + 2}:00`, eventCount: s.count,
            successRate: s.total ? Math.round(s.attended / s.total * 100) : 0 }))
            .sort((a, b) => b.successRate - a.successRate).slice(0, 5);
        const bestDays = Object.entries(dayStats)
            .map(([day, s]) => ({ day, count: s.count, successRate: s.total ? Math.round(s.attended / s.total * 100) : 0 }))
            .sort((a, b) => b.successRate - a.successRate);
        const insights = [];
        if (bestTimeSlots[0])
            insights.push(`بهترین ساعت: ${bestTimeSlots[0].label} (${bestTimeSlots[0].successRate}%)`);
        if (bestDays[0])
            insights.push(`پرطرفدارترین روز: ${bestDays[0].day} با ${bestDays[0].count} ایونت`);
        insights.push(`مجموع ${events.length} ایونت در ${SEASON_LABELS[season]} ${year}`);
        return { season, seasonLabel: SEASON_LABELS[season], year, totalEvents: events.length, bestTimeSlots, bestDays, insights };
    }
};
exports.SeasonalAnalysisService = SeasonalAnalysisService;
__decorate([
    (0, schedule_1.Cron)('0 0 21 3,6,9,12 *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeasonalAnalysisService.prototype, "runSeasonalAnalysis", null);
exports.SeasonalAnalysisService = SeasonalAnalysisService = SeasonalAnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SeasonalAnalysisService);
