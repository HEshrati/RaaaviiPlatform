"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RgciModule = void 0;
const common_1 = require("@nestjs/common");
const rgci_profile_service_1 = require("./rgci-profile.service");
const rgci_calculator_service_1 = require("./rgci-calculator.service");
const recommendation_service_1 = require("../recommendation/recommendation.service");
let RgciModule = class RgciModule {
};
exports.RgciModule = RgciModule;
exports.RgciModule = RgciModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [], // اگر کنترلر دارید نام آن را اینجا اضافه کنید (مثلاً RgciController)
        providers: [
            rgci_profile_service_1.RgciProfileService,
            rgci_calculator_service_1.RgciCalculatorService,
            recommendation_service_1.RecommendationService
        ],
        exports: [rgci_profile_service_1.RgciProfileService, rgci_calculator_service_1.RgciCalculatorService],
    })
], RgciModule);
