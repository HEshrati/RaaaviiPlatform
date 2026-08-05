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
exports.SmartProfile = exports.InteractionRhythm = exports.DominantNeed = exports.CommunicationType = void 0;
/**
 * SmartProfile Entity — نسخه نهایی یکپارچه‌شده
 * ترکیب هر دو فایل قدیم و جدید
 * مسیر صحیح: src/modules/smart-profile/entities/smart-profile.entity.ts
 */
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var CommunicationType;
(function (CommunicationType) {
    CommunicationType["INTROVERT"] = "introvert";
    CommunicationType["EXTROVERT"] = "extrovert";
    CommunicationType["AMBIVERT"] = "ambivert";
})(CommunicationType || (exports.CommunicationType = CommunicationType = {}));
var DominantNeed;
(function (DominantNeed) {
    DominantNeed["SEEN"] = "seen";
    DominantNeed["SECURITY"] = "security";
    DominantNeed["MEANING"] = "meaning";
    DominantNeed["FUN"] = "fun";
    DominantNeed["ENTERTAINMENT"] = "entertainment";
})(DominantNeed || (exports.DominantNeed = DominantNeed = {}));
var InteractionRhythm;
(function (InteractionRhythm) {
    InteractionRhythm["ACTIVE"] = "active";
    InteractionRhythm["CAUTIOUS"] = "cautious";
    InteractionRhythm["OBSERVER"] = "observer";
})(InteractionRhythm || (exports.InteractionRhythm = InteractionRhythm = {}));
let SmartProfile = class SmartProfile {
    get introvert_score() {
        return 100 - this.extroversion_score;
    }
    get extracted_interests() {
        return this.next_event_interests;
    }
};
exports.SmartProfile = SmartProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SmartProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', unique: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "communication_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 50 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "extroversion_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 50 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "energy_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "dominant_need", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "interaction_rhythm", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "total_events_attended", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "total_events_booked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "return_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "no_show_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SmartProfile.prototype, "is_suspended", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "suspension_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SmartProfile.prototype, "suspended_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SmartProfile.prototype, "suspension_approved_by_admin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "location_preference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "preferred_neighborhood", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], SmartProfile.prototype, "neighborhood_preferences", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "telegram_behavior", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "telegram_message_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "telegram_response_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "telegram_messages_sent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], SmartProfile.prototype, "next_event_interests", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], SmartProfile.prototype, "preferred_event_types", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], SmartProfile.prototype, "group_reactions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "group_reaction_history", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "smart_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "avg_match_satisfaction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "matching_weights", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SmartProfile.prototype, "last_ai_update", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "ai_insights", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "test_results_summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SmartProfile.prototype, "last_event_attended_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SmartProfile.prototype, "last_reminder_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "mbti_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "mbti_ei", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "mbti_sn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "mbti_tf", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "mbti_jp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 15 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "neo_e", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 15 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "neo_a", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 15 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "neo_c", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 15 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "neo_n", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 15 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "neo_o", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 31 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "ecr_anxiety", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 31 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "ecr_avoidance", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "attachment_style", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 21 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "erq_reappraisal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 14 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "erq_suppression", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 20 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "iri_empathy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 20 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "iri_perspective", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "hex_h", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "hex_e", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "hex_x", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "hex_a", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "hex_c", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "hex_o", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "gottman_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "gottman_horsemen", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "love_lang_primary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "love_lang_scores", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SmartProfile.prototype, "conflict_style", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "sexual_compat_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "phq9_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "gad7_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "dass_d", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "dass_a", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "dass_s", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "bai_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "isi_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "asrs_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "mdq_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "ybocs_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "pcl5_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "bdi2_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "pid5_dims", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "ysq_schemas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "mmpi_flags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "mcmi_flags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "test_signature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "matching_confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], SmartProfile.prototype, "deal_breakers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], SmartProfile.prototype, "green_flags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "mental_health_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "relationship_readiness", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "core_tests_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "compatibility_vector", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SmartProfile.prototype, "last_test_sync", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SmartProfile.prototype, "event_feedback", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], SmartProfile.prototype, "recommended_article_cats", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SmartProfile.prototype, "phase1_complete", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SmartProfile.prototype, "phase2_complete", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "phase3_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "total_tests_done", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], SmartProfile.prototype, "profile_completeness", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SmartProfile.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SmartProfile.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], SmartProfile.prototype, "user", void 0);
exports.SmartProfile = SmartProfile = __decorate([
    (0, typeorm_1.Entity)('smart_profiles')
], SmartProfile);
