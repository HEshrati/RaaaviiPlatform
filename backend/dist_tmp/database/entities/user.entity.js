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
exports.User = void 0;
const typeorm_1 = require("typeorm");
let User = class User {
    get password_hash() {
        return this.passwordHash;
    }
    get phone_number() {
        return this.mobileNumber;
    }
    get is_verified() {
        return this.isVerified;
    }
    get is_banned() {
        return this.isBanned;
    }
    get last_login() {
        return this.lastLogin;
    }
    get login_count() {
        return this.loginCount;
    }
    get created_at() {
        return this.createdAt;
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: 'password_hash' }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true, name: 'phone_number' }),
    __metadata("design:type", String)
], User.prototype, "mobileNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false, name: 'is_test_taken' }),
    __metadata("design:type", Boolean)
], User.prototype, "isTestTaken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', unique: true, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "telegram_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "telegram_username", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'user' }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "credits_balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false, name: 'is_verified' }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false, name: 'is_banned' }),
    __metadata("design:type", Boolean)
], User.prototype, "isBanned", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0, name: 'warning_count' }),
    __metadata("design:type", Number)
], User.prototype, "warningCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'ban_reason' }),
    __metadata("design:type", String)
], User.prototype, "banReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'onboarding' }),
    __metadata("design:type", String)
], User.prototype, "current_fsm_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'last_login' }),
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0, name: 'login_count' }),
    __metadata("design:type", Number)
], User.prototype, "loginCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)('Profile', 'user', { cascade: true }),
    __metadata("design:type", Object)
], User.prototype, "profile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Booking', 'user'),
    __metadata("design:type", Array)
], User.prototype, "bookings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Payment', 'user'),
    __metadata("design:type", Array)
], User.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Match', 'user'),
    __metadata("design:type", Array)
], User.prototype, "initiated_matches", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Match', 'target_user'),
    __metadata("design:type", Array)
], User.prototype, "received_matches", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Message', 'sender'),
    __metadata("design:type", Array)
], User.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Feedback', 'user'),
    __metadata("design:type", Array)
], User.prototype, "feedbacks_given", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Feedback', 'target'),
    __metadata("design:type", Array)
], User.prototype, "feedbacks_received", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
