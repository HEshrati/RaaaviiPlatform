"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bot_controller_1 = require("./bot.controller");
const user_entity_1 = require("../users/entities/user.entity");
const profile_entity_1 = require("../profiles/entities/profile.entity");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const cafe_access_entity_1 = require("../cafe-access/entities/cafe-access.entity");
const event_entity_1 = require("../events/entities/event.entity");
const matching_module_1 = require("../matching/matching.module");
const ai_content_module_1 = require("../ai-content/ai-content.module");
const cafe_access_module_1 = require("../cafe-access/cafe-access.module");
let BotModule = class BotModule {
};
exports.BotModule = BotModule;
exports.BotModule = BotModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, profile_entity_1.Profile, smart_profile_entity_1.SmartProfile, booking_entity_1.Booking, cafe_access_entity_1.CafeAccess, event_entity_1.Event]),
            matching_module_1.MatchingModule,
            ai_content_module_1.AiContentModule,
            cafe_access_module_1.CafeAccessModule,
        ],
        controllers: [bot_controller_1.BotController],
    })
], BotModule);
