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
var MyTherapistService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyTherapistService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const therapist_profile_entity_1 = require("./entities/therapist-profile.entity");
const support_group_entity_1 = require("./entities/support-group.entity");
const intake_response_entity_1 = require("./entities/intake-response.entity");
const session_booking_entity_1 = require("./entities/session-booking.entity");
let MyTherapistService = MyTherapistService_1 = class MyTherapistService {
    constructor(therapistRepo, groupRepo, intakeRepo, bookingRepo, membershipRepo) {
        this.therapistRepo = therapistRepo;
        this.groupRepo = groupRepo;
        this.intakeRepo = intakeRepo;
        this.bookingRepo = bookingRepo;
        this.membershipRepo = membershipRepo;
        this.logger = new common_1.Logger(MyTherapistService_1.name);
    }
    async submitIntake(userId, dto) {
        let intake = await this.intakeRepo.findOne({ where: { user_id: userId } });
        if (!intake) {
            intake = this.intakeRepo.create({ user_id: userId });
        }
        intake.concern_topics = dto.concernTopics;
        intake.custom_concern = dto.customConcern;
        intake.preferred_mode = dto.preferredMode;
        intake.preferred_times = dto.preferredTimes;
        intake.city = dto.city;
        intake.scale_answers = dto.scaleAnswers;
        intake.budget = dto.budget;
        intake.gender_preference = dto.genderPreference || 'any';
        intake.notes = dto.notes;
        return this.intakeRepo.save(intake);
    }
    async getMyIntake(userId) {
        return this.intakeRepo.findOne({ where: { user_id: userId } });
    }
    async getTherapists(userId) {
        const intake = await this.intakeRepo.findOne({ where: { user_id: userId } });
        const list = await this.therapistRepo.find({
            where: { is_active: true, verified: true },
            relations: ['user'],
        });
        return list.map((t) => this.shapeTherapist(t, intake));
    }
    async getTherapistById(id, userId) {
        const t = await this.therapistRepo.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!t)
            throw new common_1.NotFoundException('روانشناس پیدا نشد');
        const intake = await this.intakeRepo.findOne({ where: { user_id: userId } });
        return this.shapeTherapist(t, intake);
    }
    async getGroups(userId) {
        const intake = await this.intakeRepo.findOne({ where: { user_id: userId } });
        const list = await this.groupRepo.find({
            where: { status: 'active' },
            relations: ['facilitator', 'facilitator.user'],
        });
        return list.map((g) => this.shapeGroup(g, intake));
    }
    async getGroupById(id, userId) {
        const g = await this.groupRepo.findOne({
            where: { id },
            relations: ['facilitator', 'facilitator.user'],
        });
        if (!g)
            throw new common_1.NotFoundException('گروه پیدا نشد');
        const intake = await this.intakeRepo.findOne({ where: { user_id: userId } });
        return this.shapeGroup(g, intake);
    }
    async bookSession(userId, dto) {
        const therapist = await this.therapistRepo.findOne({
            where: { id: dto.therapistId, is_active: true },
        });
        if (!therapist)
            throw new common_1.NotFoundException('روانشناس پیدا نشد');
        const booking = this.bookingRepo.create({
            user_id: userId,
            therapist_id: therapist.id,
            slot_date: dto.slotDate,
            slot_time: dto.slotTime,
            mode: dto.mode,
            status: 'pending',
            payment_status: 'pending',
            amount: therapist.price_per_session,
        });
        const saved = await this.bookingRepo.save(booking);
        return {
            id: saved.id,
            status: saved.status,
            amount: saved.amount,
            paymentUrl: null,
            message: 'رزرو اولیه ثبت شد. در حال انتقال به پرداخت...',
        };
    }
    async joinGroup(userId, groupId) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('گروه پیدا نشد');
        if (group.status !== 'active')
            throw new common_1.BadRequestException('این گروه فعال نیست');
        const existing = await this.membershipRepo.findOne({
            where: { user_id: userId, group_id: groupId },
        });
        if (existing && ['active', 'pending'].includes(existing.status)) {
            throw new common_1.BadRequestException('شما قبلاً در این گروه عضو شده‌اید');
        }
        const isFull = group.members_count >= group.capacity;
        const membership = this.membershipRepo.create({
            user_id: userId,
            group_id: groupId,
            status: isFull ? 'on_waitlist' : 'pending',
            payment_status: 'pending',
            amount: group.price_per_month,
        });
        const saved = await this.membershipRepo.save(membership);
        return {
            id: saved.id,
            status: saved.status,
            amount: saved.amount,
            paymentUrl: null,
            message: isFull
                ? 'گروه پر است. شما به صف انتظار اضافه شدید.'
                : 'ثبت‌نام اولیه ثبت شد. در حال انتقال به پرداخت...',
        };
    }
    calcTherapistScore(t, intake) {
        if (!intake)
            return Math.round(t.rating * 18);
        const specialtyMap = {
            anxiety: ['اضطراب', 'استرس', 'وسواس'],
            depression: ['افسردگی', 'خلق', 'سوگ'],
            relationships: ['روابط', 'زوج', 'زناشویی', 'عاطفی'],
            self_growth: ['رشد فردی', 'خودشناسی', 'هویت'],
            trauma: ['تروما', 'آسیب', 'PTSD'],
            loneliness: ['تنهایی', 'انزوا', 'روابط'],
            family: ['خانواده', 'والدین'],
            career: ['شغل', 'کاری'],
            addiction: ['اعتیاد', 'وابستگی'],
        };
        let score = 0;
        const targetSpecs = (intake.concern_topics || []).flatMap((c) => specialtyMap[c] || []);
        const matches = (t.specialties || []).filter((s) => targetSpecs.some((ts) => s.includes(ts))).length;
        score += Math.min(50, matches * 17);
        if ((t.modes || []).includes(intake.preferred_mode))
            score += 25;
        if (intake.preferred_mode === 'in_person' && intake.city && t.city === intake.city) {
            score += 15;
        }
        else if (intake.preferred_mode === 'online') {
            score += 15;
        }
        score += Math.round((t.rating / 5) * 10);
        return Math.min(100, Math.max(40, score));
    }
    calcGroupScore(g, intake) {
        if (!intake)
            return 70;
        const topicMap = {
            anxiety: ['اضطراب', 'استرس'],
            depression: ['افسردگی', 'خلق'],
            relationships: ['روابط', 'زوج', 'جدایی', 'طلاق'],
            self_growth: ['رشد', 'معنا', 'خودشناسی'],
            trauma: ['تروما', 'آسیب', 'بازماندگان'],
            loneliness: ['تنهایی', 'انزوا'],
            family: ['خانواده'],
            career: ['شغل'],
            addiction: ['اعتیاد'],
        };
        let score = 50;
        const targets = (intake.concern_topics || []).flatMap((c) => topicMap[c] || []);
        if (targets.some((t) => g.topic.includes(t) || g.name.includes(t))) {
            score += 35;
        }
        if (g.mode === intake.preferred_mode)
            score += 10;
        if (g.mode === 'in_person' && intake.city && g.city === intake.city) {
            score += 5;
        }
        return Math.min(100, Math.max(40, score));
    }
    shapeTherapist(t, intake) {
        return {
            id: t.id,
            name: t.user?.name || 'روانشناس',
            avatarUrl: t.avatar_url,
            credentials: t.credentials || [],
            specialties: t.specialties || [],
            bio: t.bio,
            yearsOfExperience: t.years_of_experience,
            pricePerSession: Number(t.price_per_session),
            modes: t.modes || ['online'],
            rating: t.rating,
            reviewsCount: t.reviews_count,
            city: t.city,
            verified: t.verified,
            matchScore: this.calcTherapistScore(t, intake),
            availableSlots: [],
        };
    }
    shapeGroup(g, intake) {
        const facilitatorName = g.facilitator?.user?.name || 'تسهیل‌گر گروه';
        return {
            id: g.id,
            name: g.name,
            topic: g.topic,
            description: g.description,
            facilitatorName,
            facilitatorId: g.facilitator_id,
            schedule: g.schedule,
            mode: g.mode,
            city: g.city,
            capacity: g.capacity,
            membersCount: g.members_count,
            pricePerMonth: Number(g.price_per_month),
            confidentialityLevel: g.confidentiality_level,
            rules: g.rules || [],
            imageUrl: g.image_url,
            matchScore: this.calcGroupScore(g, intake),
        };
    }
};
exports.MyTherapistService = MyTherapistService;
exports.MyTherapistService = MyTherapistService = MyTherapistService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(therapist_profile_entity_1.TherapistProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(support_group_entity_1.SupportGroup)),
    __param(2, (0, typeorm_1.InjectRepository)(intake_response_entity_1.MtIntakeResponse)),
    __param(3, (0, typeorm_1.InjectRepository)(session_booking_entity_1.TherapySessionBooking)),
    __param(4, (0, typeorm_1.InjectRepository)(session_booking_entity_1.SupportGroupMembership)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MyTherapistService);
