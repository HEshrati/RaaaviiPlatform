"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyTherapistModule = void 0;
const consultation_topic_entity_1 = require("./entities/consultation-topic.entity");
const consultation_flow_session_entity_1 = require("./entities/consultation-flow-session.entity");
const consultation_flow_service_1 = require("./consultation-flow.service");
const consultation_flow_controller_1 = require("./consultation-flow.controller");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const my_therapist_controller_1 = require("./my-therapist.controller");
const my_therapist_service_1 = require("./my-therapist.service");
const therapist_profile_entity_1 = require("./entities/therapist-profile.entity");
const support_group_entity_1 = require("./entities/support-group.entity");
const intake_response_entity_1 = require("./entities/intake-response.entity");
const session_booking_entity_1 = require("./entities/session-booking.entity");
let MyTherapistModule = class MyTherapistModule {
};
exports.MyTherapistModule = MyTherapistModule;
exports.MyTherapistModule = MyTherapistModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                therapist_profile_entity_1.TherapistProfile,
                consultation_topic_entity_1.ConsultationTopic,
                consultation_flow_session_entity_1.ConsultationFlowSession,
                support_group_entity_1.SupportGroup,
                intake_response_entity_1.MtIntakeResponse,
                session_booking_entity_1.TherapySessionBooking,
                session_booking_entity_1.SupportGroupMembership,
            ]),
        ],
        controllers: [
            consultation_flow_controller_1.ConsultationFlowController, my_therapist_controller_1.MyTherapistController
        ],
        providers: [
            consultation_flow_service_1.ConsultationFlowService, my_therapist_service_1.MyTherapistService
        ],
        exports: [my_therapist_service_1.MyTherapistService],
    })
], MyTherapistModule);
