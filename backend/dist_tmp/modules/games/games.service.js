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
exports.GamesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_quiz_entity_1 = require("./entities/event-quiz.entity");
const quiz_result_entity_1 = require("./entities/quiz-result.entity");
let GamesService = class GamesService {
    constructor(quizRepo, resultRepo) {
        this.quizRepo = quizRepo;
        this.resultRepo = resultRepo;
    }
    async createQuiz(eventId, title, questions, game_type = 'icebreaker', settings) {
        const quiz = this.quizRepo.create({ event_id: eventId, title, questions, game_type, settings });
        return this.quizRepo.save(quiz);
    }
    async updateQuiz(quizId, data) {
        const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
        if (!quiz)
            throw new common_1.NotFoundException('کوییز پیدا نشد');
        Object.assign(quiz, data);
        return this.quizRepo.save(quiz);
    }
    async getQuizByEvent(eventId) {
        const quiz = await this.quizRepo.findOne({ where: { event_id: eventId, is_active: true } });
        if (!quiz)
            return null;
        // سوال‌ها بدون پاسخ درست
        return {
            ...quiz,
            questions: quiz.questions.map((q) => ({
                id: q.id,
                question: q.question,
                options: q.options,
                // correct_answer حذف می‌شه
            })),
        };
    }
    async submitQuiz(quizId, userId, answers) {
        const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
        if (!quiz)
            throw new common_1.NotFoundException('کوییز پیدا نشد');
        let score = 0;
        const correct_answers = [];
        const explanations = [];
        quiz.questions.forEach((q, idx) => {
            correct_answers.push(q.correct_answer);
            explanations.push(q.explanation || '');
            if (answers[idx] === q.correct_answer)
                score++;
        });
        // ذخیره نتیجه (یک بار)
        const existing = await this.resultRepo.findOne({ where: { quiz_id: quizId, user_id: userId } });
        if (!existing) {
            await this.resultRepo.save(this.resultRepo.create({
                quiz_id: quizId, user_id: userId, event_id: quiz.event_id,
                score, total_questions: quiz.questions.length, answers,
            }));
        }
        return { score, total: quiz.questions.length, correct_answers, explanations };
    }
    async getLeaderboard(quizId) {
        return this.resultRepo.find({
            where: { quiz_id: quizId },
            order: { score: 'DESC', completed_at: 'ASC' },
            take: 10,
        });
    }
};
exports.GamesService = GamesService;
exports.GamesService = GamesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_quiz_entity_1.EventQuiz)),
    __param(1, (0, typeorm_1.InjectRepository)(quiz_result_entity_1.QuizResult)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GamesService);
