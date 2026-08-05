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
exports.TestResultsController = void 0;
const common_1 = require("@nestjs/common");
const test_results_service_1 = require("./test-results.service");
const create_test_result_dto_1 = require("./dto/create-test-result.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let TestResultsController = class TestResultsController {
    constructor(testResultsService) {
        this.testResultsService = testResultsService;
    }
    async create(req, createTestResultDto) {
        return await this.testResultsService.create(req.user.id, createTestResultDto);
    }
    async getMyTestResults(req) {
        const results = await this.testResultsService.findByUserId(req.user.id);
        const mapped = results.map((result) => ({
            id: result.id,
            test_name: result.test_name,
            test_id: result.test_id || result.test_name,
            main_result: result.main_result,
            completed_at: result.completed_at,
            scores: result.scores,
        }));
        return { results: mapped, data: mapped };
    }
    // ── Admin: دریافت نتیجه تست یک کاربر خاص ──────────────────
    async getUserTestResults(userId) {
        const results = await this.testResultsService.findByUserId(userId);
        return {
            data: results.map((result) => ({
                id: result.id,
                test_name: result.test_name,
                main_result: result.main_result,
                completed_at: result.completed_at,
                scores: result.scores,
            })),
        };
    }
    async getTestHistory(testId, req) {
        const userId = req.user?.userId || req.user?.id || req.user?.sub;
        const results = await this.testResultsService.dataSource.query(`SELECT id, test_name, main_result, scores, completed_at
       FROM test_results
       WHERE user_id=$1 AND test_name=$2
       ORDER BY completed_at DESC
       LIMIT 10`, [userId, testId]);
        return results;
    }
};
exports.TestResultsController = TestResultsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_test_result_dto_1.CreateTestResultDto]),
    __metadata("design:returntype", Promise)
], TestResultsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("my"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestResultsController.prototype, "getMyTestResults", null);
__decorate([
    (0, common_1.Get)("user/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestResultsController.prototype, "getUserTestResults", null);
__decorate([
    (0, common_1.Get)('history/:testId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('testId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TestResultsController.prototype, "getTestHistory", null);
exports.TestResultsController = TestResultsController = __decorate([
    (0, common_1.Controller)("test-results"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [test_results_service_1.TestResultsService])
], TestResultsController);
