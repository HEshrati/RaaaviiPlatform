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
exports.UserBehaviorEvent = exports.EventSeverity = exports.BehaviorEventType = void 0;
/**
 * Entity: UserBehaviorEvent
 * هر رفتار کاربر در سایت — کلیک، بازدید، رزرو، خطا — اینجا ثبت می‌شود
 * مسیر: src/modules/crm/entities/user-behavior-event.entity.ts
 */
const typeorm_1 = require("typeorm");
var BehaviorEventType;
(function (BehaviorEventType) {
    // ── ناوبری ──────────────────────────────────────────────────────
    BehaviorEventType["PAGE_VIEW"] = "page_view";
    BehaviorEventType["PAGE_EXIT"] = "page_exit";
    // ── احراز هویت ──────────────────────────────────────────────────
    BehaviorEventType["LOGIN"] = "login";
    BehaviorEventType["LOGOUT"] = "logout";
    BehaviorEventType["REGISTER"] = "register";
    BehaviorEventType["OTP_REQUEST"] = "otp_request";
    // ── رویدادها ────────────────────────────────────────────────────
    BehaviorEventType["EVENT_VIEW"] = "event_view";
    BehaviorEventType["EVENT_SEARCH"] = "event_search";
    BehaviorEventType["EVENT_FILTER"] = "event_filter";
    // ── رزرو ────────────────────────────────────────────────────────
    BehaviorEventType["BOOKING_START"] = "booking_start";
    BehaviorEventType["BOOKING_COMPLETE"] = "booking_complete";
    BehaviorEventType["BOOKING_CANCEL"] = "booking_cancel";
    BehaviorEventType["BOOKING_ABANDON"] = "booking_abandon";
    // ── پرداخت ──────────────────────────────────────────────────────
    BehaviorEventType["PAYMENT_START"] = "payment_start";
    BehaviorEventType["PAYMENT_SUCCESS"] = "payment_success";
    BehaviorEventType["PAYMENT_FAIL"] = "payment_fail";
    // ── پروفایل ─────────────────────────────────────────────────────
    BehaviorEventType["PROFILE_VIEW"] = "profile_view";
    BehaviorEventType["PROFILE_EDIT"] = "profile_edit";
    BehaviorEventType["TEST_COMPLETE"] = "test_complete";
    // ── محتوا ───────────────────────────────────────────────────────
    BehaviorEventType["ARTICLE_VIEW"] = "article_view";
    // ── پشتیبانی ────────────────────────────────────────────────────
    BehaviorEventType["SUPPORT_SUBMIT"] = "support_submit";
    // ── خطا ─────────────────────────────────────────────────────────
    BehaviorEventType["API_ERROR"] = "api_error";
    BehaviorEventType["ERROR_404"] = "error_404";
    // ── API (ثبت خودکار توسط Interceptor) ──────────────────────────
    BehaviorEventType["API_CALL"] = "api_call";
})(BehaviorEventType || (exports.BehaviorEventType = BehaviorEventType = {}));
var EventSeverity;
(function (EventSeverity) {
    EventSeverity["INFO"] = "info";
    EventSeverity["WARNING"] = "warning";
    EventSeverity["ERROR"] = "error";
})(EventSeverity || (exports.EventSeverity = EventSeverity = {}));
let UserBehaviorEvent = class UserBehaviorEvent {
};
exports.UserBehaviorEvent = UserBehaviorEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserBehaviorEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserBehaviorEvent.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], UserBehaviorEvent.prototype, "event_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: EventSeverity.INFO }),
    __metadata("design:type", String)
], UserBehaviorEvent.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserBehaviorEvent.prototype, "page_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserBehaviorEvent.prototype, "api_endpoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserBehaviorEvent.prototype, "http_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], UserBehaviorEvent.prototype, "response_time_ms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserBehaviorEvent.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserBehaviorEvent.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserBehaviorEvent.prototype, "user_agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UserBehaviorEvent.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserBehaviorEvent.prototype, "created_at", void 0);
exports.UserBehaviorEvent = UserBehaviorEvent = __decorate([
    (0, typeorm_1.Entity)('crm_user_behavior_events'),
    (0, typeorm_1.Index)(['user_id', 'created_at']),
    (0, typeorm_1.Index)(['event_type', 'created_at']),
    (0, typeorm_1.Index)(['session_id'])
], UserBehaviorEvent);
