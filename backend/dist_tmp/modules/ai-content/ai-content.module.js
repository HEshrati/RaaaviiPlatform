"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiContentModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ai_content_entity_1 = require("./entities/ai-content.entity");
const ai_content_service_1 = require("./ai-content.service");
const ai_content_controller_1 = require("./ai-content.controller");
let AiContentModule = class AiContentModule {
};
exports.AiContentModule = AiContentModule;
exports.AiContentModule = AiContentModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([ai_content_entity_1.AiContent])],
        controllers: [ai_content_controller_1.AiContentController],
        providers: [ai_content_service_1.AiContentService],
        exports: [ai_content_service_1.AiContentService],
    })
], AiContentModule);
