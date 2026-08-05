"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitConcernsDto = exports.SelectProviderDto = exports.SelectTopicDto = exports.StartConsultationDto = void 0;
const class_validator_1 = require("class-validator");
class StartConsultationDto {
}
exports.StartConsultationDto = StartConsultationDto;
__decorate([
    (0, class_validator_1.IsIn)(['psychologist', 'hamzist']),
    __metadata("design:type", String)
], StartConsultationDto.prototype, "serviceType", void 0);
class SelectTopicDto {
}
exports.SelectTopicDto = SelectTopicDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SelectTopicDto.prototype, "topicSlug", void 0);
class SelectProviderDto {
}
exports.SelectProviderDto = SelectProviderDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SelectProviderDto.prototype, "providerId", void 0);
class SubmitConcernsDto {
}
exports.SubmitConcernsDto = SubmitConcernsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(200, { message: 'متن دغدغه‌ها باید حداقل ۲۰۰ کاراکتر باشد' }),
    __metadata("design:type", String)
], SubmitConcernsDto.prototype, "concernsText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SubmitConcernsDto.prototype, "testAnswers", void 0);
