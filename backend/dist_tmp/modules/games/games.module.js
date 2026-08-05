"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const games_service_1 = require("./games.service");
const games_controller_1 = require("./games.controller");
const smart_icebreaker_service_1 = require("./smart-icebreaker.service");
const event_quiz_entity_1 = require("./entities/event-quiz.entity");
const quiz_result_entity_1 = require("./entities/quiz-result.entity");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
const profile_entity_1 = require("../profiles/entities/profile.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const user_entity_1 = require("../users/entities/user.entity");
let GamesModule = class GamesModule {
};
exports.GamesModule = GamesModule;
exports.GamesModule = GamesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([event_quiz_entity_1.EventQuiz, quiz_result_entity_1.QuizResult, smart_profile_entity_1.SmartProfile, profile_entity_1.Profile, booking_entity_1.Booking, user_entity_1.User])],
        controllers: [games_controller_1.GamesController],
        providers: [games_service_1.GamesService, smart_icebreaker_service_1.SmartIcebreakerService],
        exports: [games_service_1.GamesService, smart_icebreaker_service_1.SmartIcebreakerService],
    })
], GamesModule);
