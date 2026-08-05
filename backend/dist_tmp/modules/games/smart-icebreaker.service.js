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
var SmartIcebreakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartIcebreakerService = void 0;
/**
 * سرویس بازی یخ‌شکن هوشمند — لایه ۴+۵
 * - انتخاب هوشمند کاربر برای هر سوال (بر اساس SmartProfile)
 * - تصویر خودکار مرتبط با موضوع سوال
 */
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_quiz_entity_1 = require("./entities/event-quiz.entity");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
const profile_entity_1 = require("../profiles/entities/profile.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const user_entity_1 = require("../users/entities/user.entity");
const KEYWORDS = {
    سفر: 'travel', خاطره: 'nostalgia', رویا: 'stars', غذا: 'food',
    موسیقی: 'music', کتاب: 'reading', طبیعت: 'nature', دوست: 'friendship',
    خانواده: 'family', آینده: 'horizon', ترس: 'courage', شاد: 'happiness',
    زندگی: 'wisdom', معنا: 'philosophy', هنر: 'art', ورزش: 'sport',
};
function autoImage(question, seed = 0) {
    const lq = question.toLowerCase();
    let kw = 'connection';
    for (const [k, v] of Object.entries(KEYWORDS))
        if (lq.includes(k)) {
            kw = v;
            break;
        }
    return `https://picsum.photos/seed/${seed}/800/400`;
}
let SmartIcebreakerService = SmartIcebreakerService_1 = class SmartIcebreakerService {
    constructor(quizRepo, smartProfileRepo, profileRepo, bookingRepo, userRepo) {
        this.quizRepo = quizRepo;
        this.smartProfileRepo = smartProfileRepo;
        this.profileRepo = profileRepo;
        this.bookingRepo = bookingRepo;
        this.userRepo = userRepo;
        this.logger = new common_1.Logger(SmartIcebreakerService_1.name);
        this.sessions = new Map();
    }
    enrichQuestionWithImage(q) {
        if (!q.image_url)
            q.image_url = autoImage(q.question, q.id || Math.random() * 1000);
        return q;
    }
    async getQuizWithImages(eventId) {
        const quiz = await this.quizRepo.findOne({ where: { event_id: eventId, is_active: true } });
        if (!quiz)
            return null;
        return {
            ...quiz,
            questions: quiz.questions.map((q, i) => ({
                id: q.id, question: q.question, options: q.options,
                image_url: q.image_url || autoImage(q.question, i * 17),
            })),
        };
    }
    async assignNextQuestion(eventId, quizId, questionIdx) {
        const quiz = await this.quizRepo.findOne({ where: { id: quizId, event_id: eventId } });
        if (!quiz)
            throw new common_1.NotFoundException('کوییز یافت نشد');
        const q = quiz.questions[questionIdx];
        if (!q)
            throw new common_1.NotFoundException('سوال یافت نشد');
        const bookings = await this.bookingRepo.find({ where: { event_id: eventId, status: 'confirmed' } });
        if (!bookings.length)
            throw new common_1.NotFoundException('شرکت‌کننده یافت نشد');
        const userIds = bookings.map(b => b.user_id);
        const [profiles, smarts, users] = await Promise.all([
            this.profileRepo.find({ where: userIds.map(id => ({ user_id: id })) }),
            this.smartProfileRepo.find({ where: userIds.map(id => ({ user_id: id })) }),
            this.userRepo.find({ where: userIds.map(id => ({ id })) }),
        ]);
        const pMap = new Map(profiles.map(p => [p.user_id, p]));
        const sMap = new Map(smarts.map(s => [s.user_id, s]));
        const uMap = new Map(users.map(u => [u.id, u]));
        const key = `${eventId}_${quizId}`;
        if (!this.sessions.has(key))
            this.sessions.set(key, new Map());
        const session = this.sessions.get(key);
        const asked = session.get(questionIdx) || [];
        const eligible = userIds.filter(id => !asked.includes(id));
        const candidates = eligible.length ? eligible : userIds;
        const lq = q.question.toLowerCase();
        const scored = candidates.map(uid => {
            const sp = sMap.get(uid);
            let score = 50 + Math.random() * 10;
            let reason = 'انتخاب هوشمند';
            if ((lq.includes('سفر') || lq.includes('مکان')) && sp?.extroversion_score && sp.extroversion_score > 60) {
                score += 20;
                reason = 'روحیه ماجراجو';
            }
            if ((lq.includes('خاطره') || lq.includes('کودکی')) && sp?.extroversion_score && sp.extroversion_score < 40) {
                score += 15;
                reason = 'درون‌گرا با خاطرات عمیق';
            }
            if ((lq.includes('دوست') || lq.includes('مردم')) && sp?.communication_type === 'extrovert') {
                score += 25;
                reason = 'روحیه اجتماعی';
            }
            if ((lq.includes('معنا') || lq.includes('زندگی')) && sp?.dominant_need === 'meaning') {
                score += 20;
                reason = 'تفکر فلسفی';
            }
            if (sp?.interaction_rhythm === 'observer') {
                score += 10;
                reason = 'نوبت صحبت';
            }
            if (sp?.telegram_behavior?.avg_messages_per_event && sp.telegram_behavior.avg_messages_per_event > 10)
                score -= 15;
            const u = uMap.get(uid);
            return { userId: uid, name: u?.name || `کاربر`, avatar: u?.avatar, reason, score };
        });
        scored.sort((a, b) => b.score - a.score);
        const best = scored[0];
        session.set(questionIdx, [...asked, best.userId]);
        return {
            questionId: q.id,
            question: q.question,
            imageUrl: q.image_url || autoImage(q.question, questionIdx * 17),
            assignedUser: { userId: best.userId, name: best.name, avatar: best.avatar, reason: best.reason },
            previouslyAsked: asked,
        };
    }
};
exports.SmartIcebreakerService = SmartIcebreakerService;
exports.SmartIcebreakerService = SmartIcebreakerService = SmartIcebreakerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_quiz_entity_1.EventQuiz)),
    __param(1, (0, typeorm_1.InjectRepository)(smart_profile_entity_1.SmartProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(profile_entity_1.Profile)),
    __param(3, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SmartIcebreakerService);
