"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ai_sessions_controller_1 = require("./ai-sessions.controller");
const ai_chat_controller_1 = require("./ai-chat.controller");
const ai_chat_service_1 = require("./ai-chat.service");
const test_result_entity_1 = require("../test-results/entities/test-result.entity");
const profile_entity_1 = require("../profiles/entities/profile.entity");
const user_behavior_event_entity_1 = require("../crm/entities/user-behavior-event.entity");
const crm_ai_alert_entity_1 = require("../crm/entities/crm-ai-alert.entity");
const user_entity_1 = require("../users/entities/user.entity");
let AiChatModule = class AiChatModule {
};
exports.AiChatModule = AiChatModule;
exports.AiChatModule = AiChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([test_result_entity_1.TestResult, profile_entity_1.Profile, user_behavior_event_entity_1.UserBehaviorEvent, crm_ai_alert_entity_1.CrmAiAlert, user_entity_1.User]),
        ],
        controllers: [ai_chat_controller_1.AiChatController, ai_sessions_controller_1.AiSessionsController],
        providers: [ai_chat_service_1.AiChatService],
    })
], AiChatModule);
