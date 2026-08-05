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
exports.SupportGroupMembership = exports.TherapySessionBooking = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const therapist_profile_entity_1 = require("./therapist-profile.entity");
const support_group_entity_1 = require("./support-group.entity");
let TherapySessionBooking = class TherapySessionBooking {
};
exports.TherapySessionBooking = TherapySessionBooking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TherapySessionBooking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TherapySessionBooking.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], TherapySessionBooking.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TherapySessionBooking.prototype, "therapist_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => therapist_profile_entity_1.TherapistProfile),
    (0, typeorm_1.JoinColumn)({ name: 'therapist_id' }),
    __metadata("design:type", therapist_profile_entity_1.TherapistProfile)
], TherapySessionBooking.prototype, "therapist", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], TherapySessionBooking.prototype, "slot_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], TherapySessionBooking.prototype, "slot_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], TherapySessionBooking.prototype, "scheduled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'online' }),
    __metadata("design:type", String)
], TherapySessionBooking.prototype, "mode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'pending' }),
    __metadata("design:type", String)
], TherapySessionBooking.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'pending' }),
    __metadata("design:type", String)
], TherapySessionBooking.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], TherapySessionBooking.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], TherapySessionBooking.prototype, "payment_ref", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TherapySessionBooking.prototype, "cancellation_reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TherapySessionBooking.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TherapySessionBooking.prototype, "updated_at", void 0);
exports.TherapySessionBooking = TherapySessionBooking = __decorate([
    (0, typeorm_1.Entity)('therapy_session_bookings')
], TherapySessionBooking);
let SupportGroupMembership = class SupportGroupMembership {
};
exports.SupportGroupMembership = SupportGroupMembership;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SupportGroupMembership.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SupportGroupMembership.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], SupportGroupMembership.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SupportGroupMembership.prototype, "group_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => support_group_entity_1.SupportGroup),
    (0, typeorm_1.JoinColumn)({ name: 'group_id' }),
    __metadata("design:type", support_group_entity_1.SupportGroup)
], SupportGroupMembership.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'pending' }),
    __metadata("design:type", String)
], SupportGroupMembership.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'pending' }),
    __metadata("design:type", String)
], SupportGroupMembership.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], SupportGroupMembership.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], SupportGroupMembership.prototype, "payment_ref", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SupportGroupMembership.prototype, "joined_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SupportGroupMembership.prototype, "left_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SupportGroupMembership.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SupportGroupMembership.prototype, "updated_at", void 0);
exports.SupportGroupMembership = SupportGroupMembership = __decorate([
    (0, typeorm_1.Entity)('support_group_memberships')
], SupportGroupMembership);
