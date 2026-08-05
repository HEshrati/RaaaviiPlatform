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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyTherapistController = void 0;
const common_1 = require("@nestjs/common");
const my_therapist_service_1 = require("./my-therapist.service");
const intake_dto_1 = require("./dto/intake.dto");
const book_session_dto_1 = require("./dto/book-session.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let MyTherapistController = class MyTherapistController {
    constructor(service) {
        this.service = service;
    }
    submitIntake(req, dto) {
        const userId = req.user?.id || req.user?.userId;
        return this.service.submitIntake(userId, dto);
    }
    async getMySessions(req) {
        const ds = this.service.dataSource ||
            this.service.ds;
        if (!ds)
            return { sessions: [] };
        const sessions = await ds.query(`
      SELECT tsb.id, tsb.status, tsb.session_date, tsb.notes,
             tp.city, tp.price_per_session, tp.bio,
             u.name as therapist_name
      FROM therapy_session_bookings tsb
      LEFT JOIN therapist_profiles tp ON tp.id = tsb.therapist_profile_id
      LEFT JOIN users u ON u.id = tp.user_id
      WHERE tsb.user_id = $1
      ORDER BY tsb.created_at DESC
    `, [req.user.id]).catch(() => []);
        return { sessions };
    }
    getMyIntake(req) {
        const userId = req.user?.id || req.user?.userId;
        return this.service.getMyIntake(userId);
    }
    getTherapists(req) {
        const userId = req.user?.id || req.user?.userId;
        return this.service.getTherapists(userId);
    }
    getTherapist(req, id) {
        const userId = req.user?.id || req.user?.userId;
        return this.service.getTherapistById(id, userId);
    }
    getGroups(req) {
        const userId = req.user?.id || req.user?.userId;
        return this.service.getGroups(userId);
    }
    getGroup(req, id) {
        const userId = req.user?.id || req.user?.userId;
        return this.service.getGroupById(id, userId);
    }
    bookSession(req, dto) {
        const userId = req.user?.id || req.user?.userId;
        return this.service.bookSession(userId, dto);
    }
    joinGroup(req, groupId) {
        const userId = req.user?.id || req.user?.userId;
        return this.service.joinGroup(userId, groupId);
    }
};
exports.MyTherapistController = MyTherapistController;
__decorate([
    (0, common_1.Post)("intake"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, intake_dto_1.IntakeDto]),
    __metadata("design:returntype", void 0)
], MyTherapistController.prototype, "submitIntake", null);
__decorate([
    (0, common_1.Get)("sessions"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MyTherapistController.prototype, "getMySessions", null);
__decorate([
    (0, common_1.Get)("intake/me"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MyTherapistController.prototype, "getMyIntake", null);
__decorate([
    (0, common_1.Get)("therapists"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MyTherapistController.prototype, "getTherapists", null);
__decorate([
    (0, common_1.Get)("therapists/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MyTherapistController.prototype, "getTherapist", null);
__decorate([
    (0, common_1.Get)("groups"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MyTherapistController.prototype, "getGroups", null);
__decorate([
    (0, common_1.Get)("groups/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MyTherapistController.prototype, "getGroup", null);
__decorate([
    (0, common_1.Post)("book"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, book_session_dto_1.BookSessionDto]),
    __metadata("design:returntype", void 0)
], MyTherapistController.prototype, "bookSession", null);
__decorate([
    (0, common_1.Post)("groups/:groupId/join"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("groupId", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MyTherapistController.prototype, "joinGroup", null);
exports.MyTherapistController = MyTherapistController = __decorate([
    (0, common_1.Controller)("my-therapist"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [my_therapist_service_1.MyTherapistService])
], MyTherapistController);
