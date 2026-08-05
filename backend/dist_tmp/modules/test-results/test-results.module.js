"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestResultsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const test_results_service_1 = require("./test-results.service");
const test_results_controller_1 = require("./test-results.controller");
const test_result_entity_1 = require("./entities/test-result.entity");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
let TestResultsModule = class TestResultsModule {
};
exports.TestResultsModule = TestResultsModule;
exports.TestResultsModule = TestResultsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([test_result_entity_1.TestResult, smart_profile_entity_1.SmartProfile])],
        controllers: [test_results_controller_1.TestResultsController],
        providers: [test_results_service_1.TestResultsService],
        exports: [test_results_service_1.TestResultsService],
    })
], TestResultsModule);
