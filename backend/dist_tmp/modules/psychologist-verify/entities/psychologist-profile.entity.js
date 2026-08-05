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
exports.PsychologistProfile = void 0;
const typeorm_1 = require("typeorm");
let PsychologistProfile = class PsychologistProfile {
};
exports.PsychologistProfile = PsychologistProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', unique: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'license_number', unique: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "licenseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mobile_number', nullable: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "mobileNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_name', nullable: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_name', nullable: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'national_id', nullable: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "nationalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name_from_irimc', nullable: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "nameFromIrimc", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "specialty", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "province", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'irimc_status', nullable: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "irirmcStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verification_status', default: 'pending_admin' }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "verificationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'professional_status', default: 'mobile_verified' }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "professionalStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trust_score', default: 0 }),
    __metadata("design:type", Number)
], PsychologistProfile.prototype, "trustScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trust_breakdown', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PsychologistProfile.prototype, "trustBreakdown", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PsychologistProfile.prototype, "specialties", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_types', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PsychologistProfile.prototype, "sessionTypes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_session_duration', default: 50 }),
    __metadata("design:type", Number)
], PsychologistProfile.prototype, "defaultSessionDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_buffer_minutes', default: 10 }),
    __metadata("design:type", Number)
], PsychologistProfile.prototype, "defaultBufferMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'public_profile_status', default: 'hidden' }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "publicProfileStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_price', nullable: true, type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PsychologistProfile.prototype, "sessionPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'available_times', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "availableTimes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'working_areas', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "workingAreas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resume_url', nullable: true }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "resumeUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PsychologistProfile.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_note', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "adminNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rejection_reason', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'needs_revision_reason', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], PsychologistProfile.prototype, "needsRevisionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], PsychologistProfile.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'submitted_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], PsychologistProfile.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rejected_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], PsychologistProfile.prototype, "rejectedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PsychologistProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PsychologistProfile.prototype, "updatedAt", void 0);
exports.PsychologistProfile = PsychologistProfile = __decorate([
    (0, typeorm_1.Entity)('psychologist_profiles')
], PsychologistProfile);
