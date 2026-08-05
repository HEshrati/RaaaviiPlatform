"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const roi_service_1 = require("./roi.service");
const roi_controller_1 = require("./roi.controller");
const event_entity_1 = require("../events/entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const feedback_entity_1 = require("../feedbacks/entities/feedback.entity");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
const user_entity_1 = require("../users/entities/user.entity");
let RoiModule = class RoiModule {
};
exports.RoiModule = RoiModule;
exports.RoiModule = RoiModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([event_entity_1.Event, booking_entity_1.Booking, feedback_entity_1.Feedback, smart_profile_entity_1.SmartProfile, user_entity_1.User])],
        providers: [roi_service_1.RoiService],
        controllers: [roi_controller_1.RoiController],
        exports: [roi_service_1.RoiService],
    })
], RoiModule);
