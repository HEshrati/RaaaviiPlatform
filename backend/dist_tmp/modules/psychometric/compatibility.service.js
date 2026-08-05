"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompatibilityService = void 0;
const common_1 = require("@nestjs/common");
// وزن‌های علمی هر بُعد
const WEIGHTS = {
    attachment: 0.28, // مهم‌ترین: سبک دلبستگی
    personality: 0.22, // شخصیت Big Five
    emotion: 0.18, // تنظیم هیجان + همدلی
    empathy: 0.12,
    conflict: 0.12, // سبک حل تعارض
    loveLanguage: 0.08, // زبان محبت
};
let CompatibilityService = class CompatibilityService {
    calculate(a, b) {
        const dims = {
            attachment: this.attachmentScore(a, b),
            personality: this.personalityScore(a, b),
            emotion: this.emotionScore(a, b),
            empathy: this.empathyScore(a, b),
            conflict: this.conflictScore(a, b),
            loveLanguage: this.loveLanguageScore(a, b),
        };
        const total = Math.round(dims.attachment * WEIGHTS.attachment +
            dims.personality * WEIGHTS.personality +
            dims.emotion * WEIGHTS.emotion +
            dims.empathy * WEIGHTS.empathy +
            dims.conflict * WEIGHTS.conflict +
            dims.loveLanguage * WEIGHTS.loveLanguage);
        const warnings = [
            ...a.redFlags.map(f => `کاربر الف: ${f}`),
            ...b.redFlags.map(f => `کاربر ب: ${f}`),
        ];
        // Red flag خاص: اضطرابی + اجتنابی = الگوی سمی
        const toxicPair = ((a.ecr?.style === 'anxious' && b.ecr?.style === 'avoidant') ||
            (a.ecr?.style === 'avoidant' && b.ecr?.style === 'anxious'));
        if (toxicPair)
            warnings.push('⚠️ الگوی دلبستگی اضطرابی-اجتنابی: ریسک بالا');
        return {
            totalScore: total,
            grade: total >= 75 ? 'A' : total >= 60 ? 'B' : total >= 45 ? 'C' : 'D',
            dimensions: dims,
            explanation: this.explain(dims, a, b),
            warnings,
            isRedFlag: toxicPair || total < 30 ||
                a.redFlags.some(f => f.includes('بحرانی')) ||
                b.redFlags.some(f => f.includes('بحرانی')),
        };
    }
    /** سازگاری دلبستگی — مهم‌ترین فاکتور */
    attachmentScore(a, b) {
        if (!a.ecr || !b.ecr)
            return 50; // داده کافی نیست
        const matrix = {
            secure: { secure: 95, anxious: 65, avoidant: 60, disorganized: 35 },
            anxious: { secure: 65, anxious: 30, avoidant: 15, disorganized: 20 },
            avoidant: { secure: 60, anxious: 15, avoidant: 40, disorganized: 25 },
            disorganized: { secure: 35, anxious: 20, avoidant: 25, disorganized: 15 },
        };
        return matrix[a.ecr.style]?.[b.ecr.style] ?? 50;
    }
    /** سازگاری شخصیت Big Five */
    personalityScore(a, b) {
        if (!a.neo || !b.neo)
            return 50;
        let score = 100;
        // روان‌رنجوری: هر دو پایین بهتر
        const avgN = (a.neo.N + b.neo.N) / 2;
        score -= Math.min(35, avgN * 1.2);
        // توافق‌پذیری: مشابه و بالا بهتر
        const diffA = Math.abs(a.neo.A - b.neo.A);
        score -= diffA * 0.8;
        score += Math.min(15, ((a.neo.A + b.neo.A) / 2 - 10) * 0.5);
        // وظیفه‌شناسی: مشابه بهتر
        const diffC = Math.abs(a.neo.C - b.neo.C);
        score -= diffC * 0.5;
        // برون‌گرایی: تنوع بهتر (یکی I یکی E)
        const diffE = Math.abs(a.neo.E - b.neo.E);
        score += Math.min(10, diffE * 0.3); // کمی تفاوت مطلوب
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    /** تنظیم هیجان */
    emotionScore(a, b) {
        if (!a.erq || !b.erq)
            return 50;
        let score = 60;
        // هر دو از بازارزیابی استفاده کنند = عالی
        const avgCR = (a.erq.reappraisal + b.erq.reappraisal) / 2;
        score += Math.min(25, (avgCR - 15) * 1.5);
        // هر دو سرکوب کنند = ارتباط ضعیف
        const avgES = (a.erq.suppression + b.erq.suppression) / 2;
        score -= Math.min(20, avgES * 0.8);
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    /** همدلی */
    empathyScore(a, b) {
        if (!a.iri && !b.iri)
            return 50;
        let score = 50;
        if (a.iri)
            score += Math.min(25, (a.iri.empathy + a.iri.perspective) * 0.5);
        if (b.iri)
            score += Math.min(25, (b.iri.empathy + b.iri.perspective) * 0.5);
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    /** سبک تعارض */
    conflictScore(a, b) {
        const matrix = {
            collab: { collab: 95, compro: 80, avoid: 55, compete: 45, accom: 70 },
            compro: { collab: 80, compro: 75, avoid: 60, compete: 50, accom: 65 },
            avoid: { collab: 55, compro: 60, avoid: 35, compete: 30, accom: 55 },
            compete: { collab: 45, compro: 50, avoid: 30, compete: 25, accom: 40 },
            accom: { collab: 70, compro: 65, avoid: 55, compete: 40, accom: 60 },
        };
        const styleA = a.conflictStyle || 'collab';
        const styleB = b.conflictStyle || 'collab';
        return matrix[styleA]?.[styleB] ?? 50;
    }
    /** زبان محبت */
    loveLanguageScore(a, b) {
        if (!a.loveLanguage || !b.loveLanguage)
            return 60;
        return a.loveLanguage === b.loveLanguage ? 90 : 55;
    }
    /** تولید توضیحات فارسی */
    explain(dims, a, b) {
        const exp = [];
        if (dims.attachment >= 80)
            exp.push('✅ سبک دلبستگی شما با هم بسیار سازگار است');
        else if (dims.attachment >= 60)
            exp.push('⚡ سبک دلبستگی نسبتاً سازگار — با کار روی ارتباط بهتر میشه');
        else
            exp.push('⚠️ تفاوت در سبک دلبستگی می‌تواند چالش‌زا باشد');
        if (dims.personality >= 70)
            exp.push('✅ شخصیت‌های مکمل با هم دارید');
        if (dims.emotion >= 70)
            exp.push('✅ هر دو در تنظیم هیجان مهارت دارید');
        if (dims.empathy >= 75)
            exp.push('✅ سطح همدلی بالا — درک متقابل خوبی خواهید داشت');
        if (a.ecr?.style === 'secure' && b.ecr?.style === 'secure')
            exp.push('🌟 هر دو سبک دلبستگی ایمن دارید — پایه رابطه محکم است');
        if (a.loveLanguage === b.loveLanguage && a.loveLanguage)
            exp.push(`💕 هر دو زبان محبت یکسانی دارید (${this.loveLangFa(a.loveLanguage)})`);
        return exp;
    }
    loveLangFa(lang) {
        return { words: 'کلام تأییدی', time: 'زمان باکیفیت', gifts: 'هدیه', service: 'خدمت', touch: 'تماس فیزیکی' }[lang] || lang;
    }
};
exports.CompatibilityService = CompatibilityService;
exports.CompatibilityService = CompatibilityService = __decorate([
    (0, common_1.Injectable)()
], CompatibilityService);
