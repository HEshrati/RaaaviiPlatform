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
exports.PsychometricController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const psychometric_service_1 = require("./psychometric.service");
const compatibility_service_1 = require("./compatibility.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const test_result_entity_1 = require("../test-results/entities/test-result.entity");
let PsychometricController = class PsychometricController {
    constructor(psychService, compatService, testRepo) {
        this.psychService = psychService;
        this.compatService = compatService;
        this.testRepo = testRepo;
    }
    /** پروفایل روان‌سنجی خودم */
    async myProfile(req) {
        const tests = await this.testRepo.find({
            where: { user_id: req.user.id },
            order: { completed_at: 'DESC' },
        });
        return this.psychService.buildProfile(req.user.id, tests);
    }
    /** سازگاری من با کاربر دیگر */
    async compatibility(req, targetId) {
        const [myTests, theirTests] = await Promise.all([
            this.testRepo.find({ where: { user_id: req.user.id } }),
            this.testRepo.find({ where: { user_id: targetId } }),
        ]);
        const profileA = this.psychService.buildProfile(req.user.id, myTests);
        const profileB = this.psychService.buildProfile(targetId, theirTests);
        return {
            myProfile: profileA,
            theirProfile: profileB,
            compatibility: this.compatService.calculate(profileA, profileB),
        };
    }
    /** تحلیل cross-test خودم */
    async crossAnalysis(req) {
        const tests = await this.testRepo.find({
            where: { user_id: req.user.id },
            order: { completed_at: 'DESC' },
        });
        const profile = this.psychService.buildProfile(req.user.id, tests);
        const insights = [];
        // تحلیل ترکیبی NEO + ECR
        if (profile.neo && profile.ecr) {
            if (profile.neo.N > 20 && profile.ecr.style === 'anxious')
                insights.push('🔍 روان‌رنجوری بالا + دلبستگی اضطرابی: در روابط به تأیید بیشتری نیاز دارید');
            if (profile.neo.E > 20 && profile.ecr.style === 'avoidant')
                insights.push('🔍 برون‌گرایی + اجتناب دلبستگی: در جمع انرژی می‌گیرید اما از صمیمیت می‌ترسید');
            if (profile.neo.A > 20 && profile.ecr.style === 'secure')
                insights.push('🌟 توافق‌پذیری بالا + دلبستگی ایمن: پتانسیل عالی برای روابط بلندمدت');
        }
        // تحلیل ERQ + IRI
        if (profile.erq && profile.iri) {
            if (profile.erq.reappraisal > 21 && profile.iri.empathy > 15)
                insights.push('🌟 تنظیم هیجان خوب + همدلی بالا: در مدیریت تعارضات عالی هستید');
            if (profile.erq.suppression > 14 && profile.iri.empathy < 10)
                insights.push('⚠️ سرکوب هیجان + همدلی پایین: ممکن است ارتباط عاطفی سطحی بماند');
        }
        // ریسک سلامت روان
        if (profile.phq9 !== null && profile.gad7 !== null) {
            if (profile.phq9 > 9 && profile.gad7 > 9)
                insights.push('🔴 افسردگی و اضطراب همزمان: مشاوره با متخصص توصیه می‌شود');
        }
        return { profile, insights, redFlags: profile.redFlags };
    }
};
exports.PsychometricController = PsychometricController;
__decorate([
    (0, common_1.Get)('my-profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PsychometricController.prototype, "myProfile", null);
__decorate([
    (0, common_1.Get)('compatibility/:targetUserId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('targetUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PsychometricController.prototype, "compatibility", null);
__decorate([
    (0, common_1.Get)('cross-analysis'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PsychometricController.prototype, "crossAnalysis", null);
exports.PsychometricController = PsychometricController = __decorate([
    (0, common_1.Controller)('psychometric'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(2, (0, typeorm_1.InjectRepository)(test_result_entity_1.TestResult)),
    __metadata("design:paramtypes", [psychometric_service_1.PsychometricService,
        compatibility_service_1.CompatibilityService,
        typeorm_2.Repository])
], PsychometricController);
