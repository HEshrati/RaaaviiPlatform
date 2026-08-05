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
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const profile_entity_1 = require("./entities/profile.entity");
/**
 * تبدیل Profile entity به فرمت مورد انتظار فرانت‌اند (camelCase)
 */
function serializeProfile(profile) {
    return {
        avatarUrl: profile.avatar_url ?? null,
        bio: profile.bio ?? '',
        interests: profile.interests ?? [],
        city: profile.city ?? '',
        age: profile.age ?? null,
        gender: profile.gender ?? '',
        education: profile.education_level ?? '',
        // فیلدهای اضافی
        firstName: profile.first_name ?? '',
        lastName: profile.last_name ?? '',
        maritalStatus: profile.marital_status ?? '',
        educationLevel: profile.education_level ?? '',
        completionPercentage: profile.profile_completion_percentage,
        isPublic: profile.is_public,
        profileViews: profile.profile_views,
        updatedAt: profile.updated_at,
    };
}
let ProfilesService = class ProfilesService {
    constructor(profilesRepository) {
        this.profilesRepository = profilesRepository;
    }
    async create(userId) {
        const profile = this.profilesRepository.create({
            user_id: userId,
            profile_completion_percentage: 0,
            interests: [],
        });
        const saved = await this.profilesRepository.save(profile);
        return serializeProfile(saved);
    }
    async findByUserId(userId) {
        return await this.profilesRepository.findOne({
            where: { user_id: userId },
        });
    }
    async findByUserIdSerialized(userId) {
        const profile = await this.findByUserId(userId);
        if (!profile)
            return null;
        return serializeProfile(profile);
    }
    async update(userId, data) {
        let profile = await this.findByUserId(userId);
        // ✅ Auto-create profile if it doesn't exist (fixes "not saving in dev mode" bug)
        if (!profile) {
            profile = this.profilesRepository.create({
                user_id: userId,
                profile_completion_percentage: 0,
                interests: [],
            });
        }
        // Map education (فرانت) → education_level (دیتابیس)
        if (data.education !== undefined && data.education_level === undefined) {
            data.education_level = data.education;
        }
        // اعمال تغییرات با نادیده گرفتن فیلد education (که alias است)
        const { education, ...rest } = data;
        Object.assign(profile, rest);
        profile.profile_completion_percentage = this.calculateCompletion(profile);
        const saved = await this.profilesRepository.save(profile);
        // Log successful save for debugging
        return serializeProfile(saved);
    }
    async completeProfile(userId) {
        const profile = await this.findByUserId(userId);
        if (!profile) {
            throw new common_1.NotFoundException('پروفایل یافت نشد');
        }
        profile.profile_completion_percentage = 100;
        const saved = await this.profilesRepository.save(profile);
        return serializeProfile(saved);
    }
    calculateCompletion(profile) {
        let score = 0;
        const fields = [
            'first_name',
            'last_name',
            'gender',
            'birth_date',
            'city',
            'bio',
            'education_level',
            'age',
        ];
        fields.forEach((field) => {
            if (profile[field] !== null && profile[field] !== undefined && profile[field] !== '') {
                score += 100 / fields.length;
            }
        });
        // interests امتیاز جداگانه
        if (profile.interests && profile.interests.length > 0) {
            score = Math.min(100, score + 5);
        }
        return Math.round(score);
    }
};
exports.ProfilesService = ProfilesService;
exports.ProfilesService = ProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(profile_entity_1.Profile)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProfilesService);
