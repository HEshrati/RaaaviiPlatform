"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const profiles_service_1 = require("./profiles.service");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const multer_1 = require("multer");
const path_1 = require("path");
const fs = __importStar(require("fs"));
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/avatars';
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
let ProfilesController = class ProfilesController {
    constructor(profilesService) {
        this.profilesService = profilesService;
    }
    /**
     * GET /api/profiles/me
     * دریافت پروفایل کاربر با فرمت camelCase مناسب برای فرانت‌اند
     */
    async getMyProfile(req) {
        let profile = await this.profilesService.findByUserIdSerialized(req.user.id);
        if (!profile) {
            // Auto-create empty profile (fixes first-time save issue)
            try {
                profile = await this.profilesService.create(req.user.id);
            }
            catch {
                // Profile might already exist in a race condition
                profile = await this.profilesService.findByUserIdSerialized(req.user.id);
            }
            if (!profile) {
                return {
                    avatarUrl: null, bio: '', interests: [], city: '',
                    age: null, gender: '', education: '', completionPercentage: 0,
                };
            }
        }
        return profile;
    }
    /**
     * PATCH /api/profiles/me
     * به‌روزرسانی پروفایل - فرانت می‌تواند education یا education_level بفرستد
     */
    async updateMyProfile(req, updateProfileDto) {
        return await this.profilesService.update(req.user.id, updateProfileDto);
    }
    /**
     * POST /api/profiles/me/avatar
     * آپلود عکس پروفایل
     */
    async uploadAvatar(req, file) {
        if (!file) {
            throw new common_1.BadRequestException('فایلی انتخاب نشده است');
        }
        const baseUrl = process.env.BACKEND_PUBLIC_URL || 'http://localhost:4000';
        const avatarUrl = `${baseUrl}/uploads/avatars/${file.filename}`;
        // حذف آواتار قدیمی
        const profile = await this.profilesService.findByUserId(req.user.id);
        if (profile?.avatar_url) {
            try {
                const oldFilename = profile.avatar_url.split('/').pop();
                const oldPath = `${UPLOAD_DIR}/${oldFilename}`;
                if (fs.existsSync(oldPath))
                    fs.unlinkSync(oldPath);
            }
            catch { }
        }
        await this.profilesService.update(req.user.id, {
            avatar_url: avatarUrl,
        });
        return { avatarUrl, message: 'عکس پروفایل با موفقیت آپلود شد' };
    }
    /**
     * POST /api/profiles/me/complete
     * تکمیل پروفایل
     */
    async completeProfile(req) {
        const profile = await this.profilesService.completeProfile(req.user.id);
        return {
            message: 'پروفایل با موفقیت تکمیل شد',
            profile: {
                is_complete: true,
                completion_percentage: profile.completionPercentage,
            },
        };
    }
};
exports.ProfilesController = ProfilesController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Post)('me/avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', {
        storage: (0, multer_1.diskStorage)({
            destination: UPLOAD_DIR,
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                callback(null, `avatar-${uniqueSuffix}${ext}`);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (req, file, callback) => {
            const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (allowed.includes(file.mimetype)) {
                callback(null, true);
            }
            else {
                callback(new common_1.BadRequestException('فرمت فایل مجاز نیست. JPG، PNG یا WebP انتخاب کنید.'), false);
            }
        },
    })),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('me/complete'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfilesController.prototype, "completeProfile", null);
exports.ProfilesController = ProfilesController = __decorate([
    (0, common_1.Controller)('profiles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [profiles_service_1.ProfilesService])
], ProfilesController);
