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
exports.RgciResponse = void 0;
const typeorm_1 = require("typeorm");
let RgciResponse = class RgciResponse {
};
exports.RgciResponse = RgciResponse;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RgciResponse.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RgciResponse.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RgciResponse.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RgciResponse.prototype, "dim_psychological_need", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RgciResponse.prototype, "dim_relational_goal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RgciResponse.prototype, "dim_emotional_readiness", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RgciResponse.prototype, "dim_interaction_style", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RgciResponse.prototype, "dim_depth_disclosure", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RgciResponse.prototype, "dim_shared_experience", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RgciResponse.prototype, "dim_participation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RgciResponse.prototype, "dim_psychological_safety", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 4, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RgciResponse.prototype, "dim_homogeneity_pref", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RgciResponse.prototype, "rgci_total_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RgciResponse.prototype, "dominant_psychological_need", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RgciResponse.prototype, "raw_responses", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RgciResponse.prototype, "created_at", void 0);
exports.RgciResponse = RgciResponse = __decorate([
    (0, typeorm_1.Entity)('rgci_responses')
], RgciResponse);
