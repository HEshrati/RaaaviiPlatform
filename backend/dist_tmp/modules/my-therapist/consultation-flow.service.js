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
exports.ConsultationFlowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const consultation_topic_entity_1 = require("./entities/consultation-topic.entity");
const consultation_flow_session_entity_1 = require("./entities/consultation-flow-session.entity");
const therapist_profile_entity_1 = require("./entities/therapist-profile.entity");
let ConsultationFlowService = class ConsultationFlowService {
    constructor(topicsRepo, sessionsRepo, therapistsRepo) {
        this.topicsRepo = topicsRepo;
        this.sessionsRepo = sessionsRepo;
        this.therapistsRepo = therapistsRepo;
    }
    /** تمام تاپیک‌های فعال */
    async getTopics(serviceType) {
        const qb = this.topicsRepo.createQueryBuilder('t').where('t.is_active = true');
        if (serviceType)
            qb.andWhere(':type = ANY(t.service_types)', { type: serviceType });
        return qb.orderBy('t.sort_order', 'ASC').getMany();
    }
    /** شروع session — یا بازگردانی session ناتموم */
    async startSession(userId, dto) {
        const existing = await this.sessionsRepo.findOne({
            where: { user_id: userId, status: 'step_topic' },
            order: { created_at: 'DESC' },
        });
        if (existing) {
            existing.service_type = dto.serviceType;
            return { session: await this.sessionsRepo.save(existing), isNew: false };
        }
        const session = this.sessionsRepo.create({
            user_id: userId,
            service_type: dto.serviceType,
            status: 'step_topic',
        });
        return { session: await this.sessionsRepo.save(session), isNew: true };
    }
    /** مرحله ۱: انتخاب تاپیک */
    async selectTopic(userId, sessionId, dto) {
        const session = await this.getOrFail(sessionId, userId);
        const topic = await this.topicsRepo.findOne({ where: { slug: dto.topicSlug } });
        if (!topic)
            throw new common_1.NotFoundException('تاپیک پیدا نشد');
        session.topic_slug = dto.topicSlug;
        session.status = 'step_provider';
        return this.sessionsRepo.save(session);
    }
    /** مرحله ۲: لیست providers بر اساس topic */
    async getProviders(sessionId, userId) {
        const session = await this.getOrFail(sessionId, userId);
        if (!session.topic_slug)
            throw new common_1.BadRequestException('اول تاپیک رو انتخاب کن');
        const topic = await this.topicsRepo.findOne({ where: { slug: session.topic_slug } });
        if (session.service_type === 'hamzist') {
            return { providers: [], topic, note: 'همزیست‌ها به زودی اضافه می‌شوند' };
        }
        const therapists = await this.therapistsRepo
            .createQueryBuilder('t')
            .where(':slug = ANY(t.specialties)', { slug: session.topic_slug })
            .orWhere(':name = ANY(t.specialties)', { name: topic?.name || '' })
            .limit(20)
            .getMany();
        return { providers: therapists, topic };
    }
    /** مرحله ۲: انتخاب provider */
    async selectProvider(userId, sessionId, dto) {
        const session = await this.getOrFail(sessionId, userId);
        session.selected_provider_id = dto.providerId;
        session.status = 'step_tests';
        return this.sessionsRepo.save(session);
    }
    /** تست‌های لازم برای تاپیک */
    async getRequiredTests(sessionId, userId) {
        const session = await this.getOrFail(sessionId, userId);
        const topic = session.topic_slug
            ? await this.topicsRepo.findOne({ where: { slug: session.topic_slug } })
            : null;
        return {
            session,
            topic,
            requiredTests: topic?.required_tests || [],
            privacyNote: 'نتایج تست‌ها و متن نوشته‌شده فقط برای روانشناس شما قابل مشاهده است.',
        };
    }
    /** مرحله ۳: ارسال دغدغه‌ها و پاسخ تست‌ها */
    async submitConcerns(userId, sessionId, dto) {
        const session = await this.getOrFail(sessionId, userId);
        if (dto.concernsText.length < 200)
            throw new common_1.BadRequestException('متن باید حداقل ۲۰۰ کاراکتر باشد');
        session.concerns_text = dto.concernsText;
        session.concerns_char_count = dto.concernsText.length;
        session.test_answers = dto.testAnswers || {};
        session.status = 'completed';
        session.completed_at = new Date();
        const saved = await this.sessionsRepo.save(session);
        // اعلان به ادمین از طریق لاگ (بعداً notification service وصل میشه)
        const logger = new common_1.Logger('ConsultationFlow');
        logger.log(`New consultation request: user=${userId} topic=${session.topic_slug} provider=${session.selected_provider_id}`);
        return saved;
    }
    async getSession(sessionId, userId) {
        return this.getOrFail(sessionId, userId);
    }
    async getMySessions(userId) {
        return this.sessionsRepo.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
    }
    async getAdminRequests(requestingUserId) {
        // همه session های completed
        return this.sessionsRepo.find({
            where: { status: 'completed' },
            order: { completed_at: 'DESC' },
            take: 100,
        });
    }
    async getOrFail(id, userId) {
        const s = await this.sessionsRepo.findOne({ where: { id, user_id: userId } });
        if (!s)
            throw new common_1.NotFoundException('session پیدا نشد');
        return s;
    }
};
exports.ConsultationFlowService = ConsultationFlowService;
exports.ConsultationFlowService = ConsultationFlowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(consultation_topic_entity_1.ConsultationTopic)),
    __param(1, (0, typeorm_1.InjectRepository)(consultation_flow_session_entity_1.ConsultationFlowSession)),
    __param(2, (0, typeorm_1.InjectRepository)(therapist_profile_entity_1.TherapistProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ConsultationFlowService);
