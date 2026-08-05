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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
function isAdminUser(user) {
    const ADMIN_PHONES = ['09929564895', '09356815523', '09933830958'];
    if (!user)
        return false;
    const raw = user?.mobileNumber || user?.phone_number || '';
    const phone = raw.replace(/[\s\-+]/g, '').replace(/^98/, '0');
    return ADMIN_PHONES.includes(phone);
}
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/events';
let UploadController = class UploadController {
    async uploadEventImage(file, req) {
        if (!isAdminUser(req.user)) {
            throw new common_1.BadRequestException('دسترسی ادمین لازم است');
        }
        if (!file) {
            throw new common_1.BadRequestException('فایلی انتخاب نشده است');
        }
        const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
        const imageUrl = `${BACKEND_URL}/uploads/events/${file.filename}`;
        return {
            success: true,
            imageUrl,
            filename: file.filename,
            size: file.size,
        };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('event-image'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                // اطمینان از وجود پوشه
                const dir = (0, path_1.join)(process.cwd(), 'uploads', 'events');
                if (!(0, fs_1.existsSync)(dir))
                    (0, fs_1.mkdirSync)(dir, { recursive: true });
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const uniqueName = `event-${Date.now()}-${Math.round(Math.random() * 1e9)}${(0, path_1.extname)(file.originalname)}`;
                cb(null, uniqueName);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (req, file, cb) => {
            if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('فقط فرمت‌های JPG, PNG, WebP مجاز است'), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadEventImage", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)
], UploadController);
