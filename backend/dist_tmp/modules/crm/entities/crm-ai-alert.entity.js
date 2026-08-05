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
exports.CrmAiAlert = exports.AlertSeverity = exports.AlertStatus = exports.AlertType = void 0;
/**
 * Entity: CrmAiAlert
 * هشدارهایی که هوش مصنوعی از تحلیل رفتار کاربران تولید می‌کند
 * مسیر: src/modules/crm/entities/crm-ai-alert.entity.ts
 */
const typeorm_1 = require("typeorm");
var AlertType;
(function (AlertType) {
    AlertType["ANOMALY"] = "anomaly";
    AlertType["CHURN_RISK"] = "churn_risk";
    AlertType["PAYMENT_ISSUE"] = "payment_issue";
    AlertType["HIGH_ERROR_RATE"] = "high_error_rate";
    AlertType["BOOKING_DROP"] = "booking_drop";
    AlertType["SUSPICIOUS"] = "suspicious";
    AlertType["PERFORMANCE"] = "performance";
    AlertType["ENGAGEMENT_LOW"] = "engagement_low";
    AlertType["POSITIVE_TREND"] = "positive_trend";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["OPEN"] = "open";
    AlertStatus["REVIEWED"] = "reviewed";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["IGNORED"] = "ignored";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
let CrmAiAlert = class CrmAiAlert {
};
exports.CrmAiAlert = CrmAiAlert;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CrmAiAlert.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], CrmAiAlert.prototype, "alert_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: AlertSeverity.MEDIUM }),
    __metadata("design:type", String)
], CrmAiAlert.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: AlertStatus.OPEN }),
    __metadata("design:type", String)
], CrmAiAlert.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], CrmAiAlert.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CrmAiAlert.prototype, "ai_analysis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CrmAiAlert.prototype, "recommendation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CrmAiAlert.prototype, "raw_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CrmAiAlert.prototype, "related_user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 0 }),
    __metadata("design:type", Number)
], CrmAiAlert.prototype, "risk_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CrmAiAlert.prototype, "admin_note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CrmAiAlert.prototype, "reviewed_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], CrmAiAlert.prototype, "reviewed_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CrmAiAlert.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CrmAiAlert.prototype, "updated_at", void 0);
exports.CrmAiAlert = CrmAiAlert = __decorate([
    (0, typeorm_1.Entity)('crm_ai_alerts'),
    (0, typeorm_1.Index)(['status', 'created_at']),
    (0, typeorm_1.Index)(['alert_type', 'severity'])
], CrmAiAlert);
