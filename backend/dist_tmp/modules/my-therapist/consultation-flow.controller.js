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
exports.ConsultationFlowController = void 0;
const common_1 = require("@nestjs/common");
const consultation_flow_service_1 = require("./consultation-flow.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const start_consultation_dto_1 = require("./dto/start-consultation.dto");
let ConsultationFlowController = class ConsultationFlowController {
    constructor(svc) {
        this.svc = svc;
    }
    getTopics(t) { return this.svc.getTopics(t); }
    start(req, dto) {
        return this.svc.startSession(req.user?.id || req.user?.userId, dto);
    }
    selectTopic(req, id, dto) {
        return this.svc.selectTopic(req.user?.id || req.user?.userId, id, dto);
    }
    getProviders(req, id) {
        return this.svc.getProviders(id, req.user?.id || req.user?.userId);
    }
    selectProvider(req, id, dto) {
        return this.svc.selectProvider(req.user?.id || req.user?.userId, id, dto);
    }
    getTests(req, id) {
        return this.svc.getRequiredTests(id, req.user?.id || req.user?.userId);
    }
    submitConcerns(req, id, dto) {
        return this.svc.submitConcerns(req.user?.id || req.user?.userId, id, dto);
    }
    mySessions(req) { return this.svc.getMySessions(req.user?.id || req.user?.userId); }
    getSession(req, id) {
        return this.svc.getSession(id, req.user?.id || req.user?.userId);
    }
    // Admin: همه درخواست‌های تکمیل‌شده
    async adminAllRequests(req) {
        const userId = req.user?.id || req.user?.userId;
        return this.svc.getAdminRequests(userId);
    }
};
exports.ConsultationFlowController = ConsultationFlowController;
__decorate([
    (0, common_1.Get)('topics'),
    __param(0, (0, common_1.Query)('serviceType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConsultationFlowController.prototype, "getTopics", null);
__decorate([
    (0, common_1.Post)('start'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_consultation_dto_1.StartConsultationDto]),
    __metadata("design:returntype", void 0)
], ConsultationFlowController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':id/topic'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, start_consultation_dto_1.SelectTopicDto]),
    __metadata("design:returntype", void 0)
], ConsultationFlowController.prototype, "selectTopic", null);
__decorate([
    (0, common_1.Get)(':id/providers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ConsultationFlowController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Post)(':id/provider'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, start_consultation_dto_1.SelectProviderDto]),
    __metadata("design:returntype", void 0)
], ConsultationFlowController.prototype, "selectProvider", null);
__decorate([
    (0, common_1.Get)(':id/required-tests'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ConsultationFlowController.prototype, "getTests", null);
__decorate([
    (0, common_1.Post)(':id/concerns'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, start_consultation_dto_1.SubmitConcernsDto]),
    __metadata("design:returntype", void 0)
], ConsultationFlowController.prototype, "submitConcerns", null);
__decorate([
    (0, common_1.Get)('my-sessions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ConsultationFlowController.prototype, "mySessions", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ConsultationFlowController.prototype, "getSession", null);
__decorate([
    (0, common_1.Get)('admin/all-requests'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConsultationFlowController.prototype, "adminAllRequests", null);
exports.ConsultationFlowController = ConsultationFlowController = __decorate([
    (0, common_1.Controller)('consultation-flow'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [consultation_flow_service_1.ConsultationFlowService])
], ConsultationFlowController);
