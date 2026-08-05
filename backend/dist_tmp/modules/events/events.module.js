"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const events_service_1 = require("./events.service");
const events_controller_1 = require("./events.controller");
const webhook_controller_1 = require("./webhook.controller");
const event_merge_service_1 = require("./event-merge.service");
const sms_reminder_service_1 = require("./sms-reminder.service");
const event_entity_1 = require("./entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const user_entity_1 = require("../users/entities/user.entity");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([event_entity_1.Event, booking_entity_1.Booking, user_entity_1.User, smart_profile_entity_1.SmartProfile]),
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [events_controller_1.EventsController, webhook_controller_1.WebhookController],
        providers: [events_service_1.EventsService, event_merge_service_1.EventMergeService, sms_reminder_service_1.SmsReminderService],
        exports: [events_service_1.EventsService, event_merge_service_1.EventMergeService, sms_reminder_service_1.SmsReminderService],
    })
], EventsModule);
