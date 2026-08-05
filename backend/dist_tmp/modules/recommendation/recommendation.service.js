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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let RecommendationService = class RecommendationService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    /**
     * تولید پیشنهادهای هوشمند بر اساس امتیازات فرسودگی، عملکرد و ابعاد ۵گانه
     * طبق بخش ۴.۳ و ۴.۷ داکیومنت راوی
     */
    async generateForUser(userId, rgciResult) {
        const { dimensions: d, outcomes: o } = rgciResult;
        const recommendations = [];
        // ۱. بررسی ریسک فرسودگی بالا (Burnout Risk > 65)
        if (o.burnout_risk > 65) {
            recommendations.push({
                type: 'challenge',
                title: 'چالش ۷ روزه خودمراقبتی و مدیریت انرژی',
                reason: 'به دلیل بالا بودن شاخص ریسک فرسودگی روانی شما، این چالش برای بازیابی توان روانی پیشنهاد می‌شود.',
                priority: 0.95,
                related_dimensions: ['safety', 'psychological_need'],
                related_indices: ['burnout_risk']
            });
        }
        // ۲. بررسی ایمنی روانی پایین (Safety < 40)
        if (d.safety < 40) {
            recommendations.push({
                type: 'article',
                title: 'چگونه در گروه‌های جدید مرزهای امن روانی ایجاد کنیم؟',
                reason: 'بر اساس پاسخ‌های شما، تقویت ایمنی روانی فردی می‌تواند به تجربه گروهی بهتر کمک کند.',
                priority: 0.85,
                related_dimensions: ['safety'],
                related_indices: ['wellbeing']
            });
        }
        // ۳. بررسی جهت‌گیری هدف (Goal) و مشارکت (Participation) برای پیشنهاد خدمات/رویداد
        if (d.goal > 70 && d.participation < 40) {
            recommendations.push({
                type: 'service',
                title: 'جلسه مشاوره تکنیک‌های مشارکت فعال در پروژه‌های تیمی',
                reason: 'شما اهداف قوی دارید اما تمایل به مشارکت پایین است. این سرویس به تعادل این دو کمک می‌کند.',
                priority: 0.80,
                related_dimensions: ['goal', 'participation'],
                related_indices: ['performance']
            });
        }
        // ذخیره در دیتابیس (جدول recommendations)
        for (const rec of recommendations) {
            await this.dataSource.query(`INSERT INTO recommendations 
         (user_id, type, title, reason, priority, related_dimensions, related_indices, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`, [
                userId,
                rec.type,
                rec.title,
                rec.reason,
                rec.priority,
                rec.related_dimensions,
                rec.related_indices
            ]);
        }
        console.log(`💡 Recommendations generated for user: ${userId}`);
    }
};
exports.RecommendationService = RecommendationService;
exports.RecommendationService = RecommendationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], RecommendationService);
