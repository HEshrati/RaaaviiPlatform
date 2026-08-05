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
var TestResultsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestResultsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const typeorm_4 = require("typeorm");
const test_result_entity_1 = require("./entities/test-result.entity");
const smart_profile_entity_1 = require("../smart-profile/entities/smart-profile.entity");
let TestResultsService = TestResultsService_1 = class TestResultsService {
    constructor(dataSource, testResultsRepository, smartProfileRepo) {
        this.dataSource = dataSource;
        this.testResultsRepository = testResultsRepository;
        this.smartProfileRepo = smartProfileRepo;
        this.logger = new common_1.Logger(TestResultsService_1.name);
    }
    async create(userId, createTestResultDto) {
        const testResult = this.testResultsRepository.create({
            user_id: userId,
            test_id: createTestResultDto.test_id || createTestResultDto.test_name,
            test_name: createTestResultDto.test_name,
            main_result: createTestResultDto.main_result || "completed",
            scores: createTestResultDto.scores || createTestResultDto.answers || {},
            completed_at: new Date(),
        });
        const saved = await this.testResultsRepository.save(testResult);
        // ── پس از ذخیره تست، داده‌ها را به smart_profiles منتقل کن ──
        if (createTestResultDto.test_name === 'onboarding_personality') {
            await this.syncToSmartProfile(userId, createTestResultDto.scores);
        }
        return saved;
    }
    /**
     * نگاشت پاسخ‌های تست به فیلدهای smart_profile
     *
     * سوال ۴  → extroversion_score  (1=درون‌گرا … 5=برون‌گرا  → 0-100)
     * سوال ۵  → energy_level        (1=نیاز به جرقه … 5=خودانگیخته → 0-100)
     * سوال ۶  → (satisfaction — فعلاً در test_results نگه می‌داریم)
     * سوالات ۱-۳ → communication_type استنتاج می‌شود
     */
    async syncToSmartProfile(userId, scores) {
        try {
            let sp = await this.smartProfileRepo.findOne({ where: { user_id: userId } });
            if (!sp) {
                sp = this.smartProfileRepo.create({ user_id: userId });
            }
            // سوال ۴: درون‌گرا/برون‌گرا — تبدیل مقیاس ۱-۵ به ۰-۱۰۰
            if (scores[4] !== undefined) {
                sp.extroversion_score = ((Number(scores[4]) - 1) / 4) * 100;
            }
            // سوال ۵: سطح انرژی و انگیزه — تبدیل مقیاس ۱-۵ به ۰-۱۰۰
            if (scores[5] !== undefined) {
                sp.energy_level = ((Number(scores[5]) - 1) / 4) * 100;
            }
            // تعیین communication_type از extroversion_score
            if (sp.extroversion_score >= 65) {
                sp.communication_type = smart_profile_entity_1.CommunicationType.EXTROVERT;
            }
            else if (sp.extroversion_score <= 35) {
                sp.communication_type = smart_profile_entity_1.CommunicationType.INTROVERT;
            }
            else {
                sp.communication_type = smart_profile_entity_1.CommunicationType.AMBIVERT;
            }
            // ذخیره خلاصه نتایج تست برای مراجعه بعدی
            sp.test_results_summary = { ...sp.test_results_summary, onboarding: scores };
            sp.last_ai_update = new Date();
            await this.smartProfileRepo.save(sp);
            this.logger.log(`SmartProfile synced for user ${userId}: extroversion=${sp.extroversion_score}, energy=${sp.energy_level}, type=${sp.communication_type}`);
        }
        catch (e) {
            this.logger.error(`Failed to sync smart profile for user ${userId}: ${e.message}`);
        }
    }
    async findByUserId(userId) {
        return await this.testResultsRepository.find({
            where: { user_id: userId },
            order: { completed_at: 'DESC' },
        });
    }
};
exports.TestResultsService = TestResultsService;
exports.TestResultsService = TestResultsService = TestResultsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectDataSource)()),
    __param(1, (0, typeorm_1.InjectRepository)(test_result_entity_1.TestResult)),
    __param(2, (0, typeorm_1.InjectRepository)(smart_profile_entity_1.SmartProfile)),
    __metadata("design:paramtypes", [typeorm_3.DataSource,
        typeorm_4.Repository,
        typeorm_4.Repository])
], TestResultsService);
