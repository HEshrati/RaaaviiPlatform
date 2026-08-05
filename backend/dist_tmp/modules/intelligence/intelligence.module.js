"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceModule = void 0;
const common_1 = require("@nestjs/common");
const intelligence_service_1 = require("./intelligence.service");
const recommendation_engine_service_1 = require("./recommendation-engine.service");
const intelligence_controller_1 = require("./intelligence.controller");
let IntelligenceModule = class IntelligenceModule {
};
exports.IntelligenceModule = IntelligenceModule;
exports.IntelligenceModule = IntelligenceModule = __decorate([
    (0, common_1.Module)({
        controllers: [intelligence_controller_1.IntelligenceController],
        providers: [intelligence_service_1.IntelligenceService, recommendation_engine_service_1.RecommendationEngineService],
        exports: [intelligence_service_1.IntelligenceService, recommendation_engine_service_1.RecommendationEngineService],
    })
], IntelligenceModule);
