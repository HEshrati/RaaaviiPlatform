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
exports.RelationalExperienceQuality = void 0;
const typeorm_1 = require("typeorm");
let RelationalExperienceQuality = class RelationalExperienceQuality {
};
exports.RelationalExperienceQuality = RelationalExperienceQuality;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RelationalExperienceQuality.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RelationalExperienceQuality.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RelationalExperienceQuality.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RelationalExperienceQuality.prototype, "group_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RelationalExperienceQuality.prototype, "psychological_safety", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RelationalExperienceQuality.prototype, "felt_heard", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RelationalExperienceQuality.prototype, "felt_accepted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RelationalExperienceQuality.prototype, "conversation_quality", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RelationalExperienceQuality.prototype, "interaction_meaning", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RelationalExperienceQuality.prototype, "participation_comfort", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RelationalExperienceQuality.prototype, "felt_connected", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RelationalExperienceQuality.prototype, "group_satisfaction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RelationalExperienceQuality.prototype, "continued_interest", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RelationalExperienceQuality.prototype, "total_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RelationalExperienceQuality.prototype, "raw_responses", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RelationalExperienceQuality.prototype, "created_at", void 0);
exports.RelationalExperienceQuality = RelationalExperienceQuality = __decorate([
    (0, typeorm_1.Entity)('relational_experience_quality')
], RelationalExperienceQuality);
