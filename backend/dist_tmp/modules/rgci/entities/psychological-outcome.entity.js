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
exports.PsychologicalOutcome = void 0;
const typeorm_1 = require("typeorm");
let PsychologicalOutcome = class PsychologicalOutcome {
};
exports.PsychologicalOutcome = PsychologicalOutcome;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PsychologicalOutcome.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PsychologicalOutcome.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PsychologicalOutcome.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PsychologicalOutcome.prototype, "stage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PsychologicalOutcome.prototype, "belonging_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PsychologicalOutcome.prototype, "loneliness_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PsychologicalOutcome.prototype, "social_vitality", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PsychologicalOutcome.prototype, "wellbeing_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PsychologicalOutcome.prototype, "raw_responses", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PsychologicalOutcome.prototype, "created_at", void 0);
exports.PsychologicalOutcome = PsychologicalOutcome = __decorate([
    (0, typeorm_1.Entity)('psychological_outcomes')
], PsychologicalOutcome);
