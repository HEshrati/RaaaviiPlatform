"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PsychometricModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const psychometric_service_1 = require("./psychometric.service");
const compatibility_service_1 = require("./compatibility.service");
const psychometric_controller_1 = require("./psychometric.controller");
const test_result_entity_1 = require("../test-results/entities/test-result.entity");
let PsychometricModule = class PsychometricModule {
};
exports.PsychometricModule = PsychometricModule;
exports.PsychometricModule = PsychometricModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([test_result_entity_1.TestResult])],
        providers: [psychometric_service_1.PsychometricService, compatibility_service_1.CompatibilityService],
        controllers: [psychometric_controller_1.PsychometricController],
        exports: [psychometric_service_1.PsychometricService, compatibility_service_1.CompatibilityService],
    })
], PsychometricModule);
