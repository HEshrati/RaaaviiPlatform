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
exports.SupportGroup = void 0;
const typeorm_1 = require("typeorm");
const therapist_profile_entity_1 = require("./therapist-profile.entity");
let SupportGroup = class SupportGroup {
};
exports.SupportGroup = SupportGroup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SupportGroup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], SupportGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], SupportGroup.prototype, "topic", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SupportGroup.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SupportGroup.prototype, "facilitator_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => therapist_profile_entity_1.TherapistProfile),
    (0, typeorm_1.JoinColumn)({ name: 'facilitator_id' }),
    __metadata("design:type", therapist_profile_entity_1.TherapistProfile)
], SupportGroup.prototype, "facilitator", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], SupportGroup.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], SupportGroup.prototype, "schedule_weekday", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, nullable: true }),
    __metadata("design:type", String)
], SupportGroup.prototype, "schedule_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'online' }),
    __metadata("design:type", String)
], SupportGroup.prototype, "mode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], SupportGroup.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], SupportGroup.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SupportGroup.prototype, "members_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], SupportGroup.prototype, "price_per_month", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'standard' }),
    __metadata("design:type", String)
], SupportGroup.prototype, "confidentiality_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, default: [] }),
    __metadata("design:type", Array)
], SupportGroup.prototype, "rules", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], SupportGroup.prototype, "image_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'active' }),
    __metadata("design:type", String)
], SupportGroup.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SupportGroup.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SupportGroup.prototype, "updated_at", void 0);
exports.SupportGroup = SupportGroup = __decorate([
    (0, typeorm_1.Entity)('support_groups')
], SupportGroup);
