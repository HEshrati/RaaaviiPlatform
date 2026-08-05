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
exports.GamesController = void 0;
const common_1 = require("@nestjs/common");
const games_service_1 = require("./games.service");
const smart_icebreaker_service_1 = require("./smart-icebreaker.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const events_controller_1 = require("../events/events.controller");
let GamesController = class GamesController {
    constructor(games, icebreaker) {
        this.games = games;
        this.icebreaker = icebreaker;
    }
    async createQuiz(body, req) {
        if (!(0, events_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException();
        const qs = body.questions.map(q => this.icebreaker.enrichQuestionWithImage(q));
        return this.games.createQuiz(body.event_id, body.title, qs, body.game_type, body.settings);
    }
    async updateQuiz(id, body, req) {
        if (!(0, events_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException();
        return this.games.updateQuiz(id, body);
    }
    /** دریافت کوییز با تصاویر خودکار مرتبط با سوال */
    async getQuizByEvent(eventId) {
        return this.icebreaker.getQuizWithImages(eventId);
    }
    /** ��� انتخاب هوشمند: مناسب‌ترین کاربر برای پاسخ به سوال */
    async smartAssign(quizId, eventId, questionIdx) {
        return this.icebreaker.assignNextQuestion(eventId, quizId, parseInt(questionIdx || '0'));
    }
    async getMyQuizzes() {
        return { quizzes: [], message: 'برای دیدن بازی‌ها باید همنشینی رزرو کنید' };
    }
    async submitQuiz(id, body, req) {
        return this.games.submitQuiz(id, req.user.id, body.answers);
    }
    async leaderboard(id) {
        return this.games.getLeaderboard(id);
    }
};
exports.GamesController = GamesController;
__decorate([
    (0, common_1.Post)('quiz'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "createQuiz", null);
__decorate([
    (0, common_1.Patch)('quiz/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "updateQuiz", null);
__decorate([
    (0, common_1.Get)('quiz/event/:eventId'),
    __param(0, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getQuizByEvent", null);
__decorate([
    (0, common_1.Get)('quiz/:quizId/smart-assign'),
    __param(0, (0, common_1.Param)('quizId')),
    __param(1, (0, common_1.Query)('eventId')),
    __param(2, (0, common_1.Query)('questionIdx')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "smartAssign", null);
__decorate([
    (0, common_1.Get)('my-quizzes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getMyQuizzes", null);
__decorate([
    (0, common_1.Post)('quiz/:id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "submitQuiz", null);
__decorate([
    (0, common_1.Get)('quiz/:id/leaderboard'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "leaderboard", null);
exports.GamesController = GamesController = __decorate([
    (0, common_1.Controller)('games'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [games_service_1.GamesService,
        smart_icebreaker_service_1.SmartIcebreakerService])
], GamesController);
