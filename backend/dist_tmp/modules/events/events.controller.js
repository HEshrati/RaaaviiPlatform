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
exports.EventsController = exports.ADMIN_PHONES = void 0;
exports.isAdminUser = isAdminUser;
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = __importStar(require("path"));
const common_1 = require("@nestjs/common");
const optional_jwt_guard_1 = require("../auth/guards/optional-jwt.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_event_dto_1 = require("./dto/create-event.dto");
const events_service_1 = require("./events.service");
// تمام ادمین‌های سیستم (باید با admin.controller.ts هماهنگ باشه)
exports.ADMIN_PHONES = [
    "09356815523",
    "09929564895",
    "09933830958",
];
function isAdminUser(user) {
    if (!user)
        return false;
    const raw = user?.mobileNumber || user?.phone_number || "";
    const phone = raw.replace(/[\s\-+]/g, "").replace(/^98/, "0");
    return exports.ADMIN_PHONES.includes(phone);
}
function requireAdmin(user) {
    if (!isAdminUser(user))
        throw new common_1.ForbiddenException("دسترسی ادمین لازم است");
}
// ── بررسی فرمت UUID ──────────────────────────────────────────────────
function isValidUUID(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
let EventsController = class EventsController {
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    // -- serve AI generated image --
    async serveEventImage(id, res) {
        const fs = require("fs");
        const filePath = "/app/event-images/" + id + ".jpg";
        if (!fs.existsSync(filePath))
            throw new common_1.NotFoundException("Image not found");
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.sendFile(filePath);
    }
    // ── ادمین: آمار موفقیت همنشینی‌ها ──────────────────────────────────
    async getAdminStats(req) {
        requireAdmin(req.user);
        return this.eventsService.getAdminStats(req.user.id);
    }
    // ── همنشینی‌های ادمین ────────────────────────────────────────────────
    async getMyEvents(req) {
        requireAdmin(req.user);
        return this.eventsService.findByCreator(req.user.id);
    }
    // ── پیشنهادات ───────────────────────────────────────────────────────
    async getRecommendations(req) {
        return this.eventsService.getGroupRecommendations(req.user.id);
    }
    // ── ✅ FIX: Route برای category-interests که فرانت صدا می‌زد ─────────
    async getCategoryInterests(req) {
        // اگر سرویس مربوطه داری اینجا صدا بزن
        // در غیر اینصورت یه آرایه خالی برگردون تا فرانت کرش نکنه
        return [];
    }
    // ── merge باید قبل از :id باشه ──────────────────────────────────────
    async mergeEvents(body, req) {
        requireAdmin(req.user);
        return { success: false, message: "از EventMergeService استفاده کنید" };
    }
    // ── لیست همنشینی‌ها (فقط شهر عمومی - بدون مکان دقیق) ─────────────
    async uploadImage(file) {
        if (!file)
            throw new common_1.BadRequestException('فایلی آپلود نشد');
        return { url: `/uploads/events/${file.filename}` };
    }
    async findAll(page, limit, city, event_type, req) {
        const userId = req?.user?.id;
        const result = await this.eventsService.findAll({
            page,
            limit,
            city,
            event_type,
            userId,
        });
        // حذف location دقیق از لیست عمومی
        return {
            ...result,
            events: result.events.map((e) => ({ ...e, location: undefined })),
        };
    }
    // ── مکان همنشینی: فقط برای رزروکنندگان در ۱۰ ساعت آخر ─────────────
    async getEventLocation(id, req) {
        if (!isValidUUID(id))
            throw new common_1.BadRequestException("شناسه رویداد معتبر نیست");
        const admin = isAdminUser(req.user);
        return this.eventsService.getLocationForUser(id, req.user.id, admin);
    }
    // ── آپدیت مکان + اعلان SMS و سایت به رزروکنندگان ─────────────────
    async notifyLocationChange(id, body, req) {
        requireAdmin(req.user);
        if (!isValidUUID(id))
            throw new common_1.BadRequestException("شناسه رویداد معتبر نیست");
        return this.eventsService.updateLocationAndNotify(id, body.location, body.city);
    }
    // ── رزروکنندگان یک همنشینی (فقط ادمین) ──────────────────────────
    async getEventAttendees(id, req) {
        requireAdmin(req.user);
        if (!isValidUUID(id))
            throw new common_1.BadRequestException("شناسه رویداد معتبر نیست");
        return this.eventsService.getEventAttendees(id);
    }
    // ── رزرو رویداد توسط کاربر ─────────────────────────────────
    async bookEvent(id, req) {
        if (!isValidUUID(id))
            throw new common_1.BadRequestException("شناسه رویداد معتبر نیست");
        return this.eventsService.bookEvent(id, req.user.id);
    }
    // ── جزئیات یک همنشینی (بدون location دقیق در پاسخ عمومی) ────────
    async findOne(id, req) {
        // ✅ FIX: جلوگیری از رسیدن رشته‌های غیر UUID به دیتابیس
        if (!isValidUUID(id))
            throw new common_1.NotFoundException(`رویداد با شناسه "${id}" پیدا نشد`);
        const event = await this.eventsService.findOne(id);
        // location دقیق فقط برای ادمین‌ها
        if (!isAdminUser(req?.user)) {
            return { ...event, location: undefined };
        }
        return event;
    }
    // ── ایجاد همنشینی (فقط ادمین) ─────────────────────────────────────
    async create(createEventDto, req) {
        requireAdmin(req.user);
        return this.eventsService.create({
            ...createEventDto,
            created_by: req.user.id,
        });
    }
    // ── ویرایش همنشینی (فقط ادمین) ────────────────────────────────────
    async update(id, data, req) {
        requireAdmin(req.user);
        if (!isValidUUID(id))
            throw new common_1.BadRequestException("شناسه رویداد معتبر نیست");
        return this.eventsService.update(id, data);
    }
    // ── غیرفعال کردن همنشینی (فقط ادمین) ─────────────────────────────
    async remove(id, req) {
        requireAdmin(req.user);
        if (!isValidUUID(id))
            throw new common_1.BadRequestException("شناسه رویداد معتبر نیست");
        await this.eventsService.update(id, { is_active: false });
    }
    async sendManualReminder(userId, req) {
        requireAdmin(req.user);
        return { success: false, message: "از SmsReminderService استفاده کنید" };
    }
    async generateImage(id) {
        return this.eventsService.generateImageForExistingEvent(id);
    }
    // ورود به لیست انتظار
    async joinWaitlist(eventId, req) {
        return this.eventsService.joinWaitlist(eventId, req.user?.id || req.user?.userId);
    }
    // وضعیت رزرو کاربر برای رویداد
    async reservationStatus(eventId, req) {
        return this.eventsService.getReservationStatus(eventId, req.user?.id || req.user?.userId);
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Get)(":id/image"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "serveEventImage", null);
__decorate([
    (0, common_1.Get)("admin/stats"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getAdminStats", null);
__decorate([
    (0, common_1.Get)("my-events"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getMyEvents", null);
__decorate([
    (0, common_1.Get)("recommendations"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)("category-interests"),
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getCategoryInterests", null);
__decorate([
    (0, common_1.Post)("merge"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "mergeEvents", null);
__decorate([
    (0, common_1.Post)('upload-image'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.diskStorage)({
            destination: '/var/www/raavi/uploads/events',
            filename: (req, file, cb) => {
                const ext = path.extname(file.originalname);
                cb(null, `event-${Date.now()}${ext}`);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/'))
                cb(null, true);
            else
                cb(new Error('فقط فایل تصویر مجاز است'), false);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtGuard),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("city")),
    __param(3, (0, common_1.Query)("event_type")),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id/location"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventLocation", null);
__decorate([
    (0, common_1.Post)(":id/notify-location"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "notifyLocationChange", null);
__decorate([
    (0, common_1.Get)(":id/attendees"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventAttendees", null);
__decorate([
    (0, common_1.Post)(":id/book"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "bookEvent", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_event_dto_1.CreateEventDto, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)("send-reminder/:userId"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "sendManualReminder", null);
__decorate([
    (0, common_1.Post)(':id/generate-image'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "generateImage", null);
__decorate([
    (0, common_1.Post)(':id/waitlist'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "joinWaitlist", null);
__decorate([
    (0, common_1.Get)(':id/reservation-status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "reservationStatus", null);
exports.EventsController = EventsController = __decorate([
    (0, common_1.Controller)("events"),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], EventsController);
