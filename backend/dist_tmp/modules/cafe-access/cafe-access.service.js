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
var CafeAccessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CafeAccessService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const cafe_access_entity_1 = require("./entities/cafe-access.entity");
const event_entity_1 = require("../events/entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
let CafeAccessService = CafeAccessService_1 = class CafeAccessService {
    constructor(cafeRepo, eventRepo, bookingRepo, jwtService) {
        this.cafeRepo = cafeRepo;
        this.eventRepo = eventRepo;
        this.bookingRepo = bookingRepo;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(CafeAccessService_1.name);
    }
    async login(username, password) {
        const cafe = await this.cafeRepo.findOne({
            where: { username, is_active: true },
        });
        if (!cafe)
            throw new common_1.UnauthorizedException("نام کاربری یا رمز اشتباه است");
        const valid = await bcrypt.compare(password, cafe.password_hash);
        if (!valid)
            throw new common_1.UnauthorizedException("نام کاربری یا رمز اشتباه است");
        const token = this.jwtService.sign({ sub: cafe.id, username: cafe.username, role: "cafe" }, { expiresIn: "12h" });
        return { token, cafeName: cafe.cafe_name, cafeId: cafe.id };
    }
    async getTodayEvents(cafeId) {
        const cafe = await this.cafeRepo.findOne({ where: { id: cafeId } });
        if (!cafe)
            throw new common_1.NotFoundException("کافه یافت نشد");
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const events = await this.eventRepo
            .createQueryBuilder("e")
            .where("e.city = :city", { city: cafe.city })
            .andWhere("e.start_date >= :start", { start })
            .andWhere("e.start_date <= :end", { end })
            .andWhere("e.is_active = true")
            .getMany();
        return events.map((e) => ({
            id: e.id,
            title: e.title,
            start_date: e.start_date,
            end_date: e.end_date,
            capacity: e.capacity,
        }));
    }
    /**
     * رویدادهای آینده (۷ روز آینده) برای ربات تلگرام
     * کافه ادمین می‌تونه رویداد رو از این لیست انتخاب کنه
     */
    async getUpcomingEvents(cafeId, days = 7) {
        const cafe = await this.cafeRepo.findOne({ where: { id: cafeId } });
        if (!cafe)
            throw new common_1.NotFoundException("کافه یافت نشد");
        const now = new Date();
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        const events = await this.eventRepo
            .createQueryBuilder("e")
            .where("e.city = :city", { city: cafe.city })
            .andWhere("e.start_date >= :now", { now })
            .andWhere("e.start_date <= :future", { future })
            .andWhere("e.is_active = true")
            .orderBy("e.start_date", "ASC")
            .getMany();
        return {
            cafe: { name: cafe.cafe_name, city: cafe.city },
            events: events.map((e) => ({
                id: e.id,
                title: e.title,
                start_date: e.start_date,
                end_date: e.end_date,
                capacity: e.capacity,
                location: e.location,
            })),
        };
    }
    async getAttendanceList(eventId, cafeId) {
        const cafe = await this.cafeRepo.findOne({ where: { id: cafeId } });
        if (!cafe)
            throw new common_1.NotFoundException("کافه یافت نشد");
        const event = await this.eventRepo.findOne({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException("رویداد یافت نشد");
        if (event.city !== cafe.city)
            throw new common_1.UnauthorizedException("این رویداد در شهر شما نیست");
        const bookings = await this.bookingRepo.find({
            where: { event_id: eventId, payment_status: "paid" },
            relations: ["user"],
        });
        return {
            event: {
                id: event.id,
                title: event.title,
                start_date: event.start_date,
                location: event.location,
            },
            cafe: { name: cafe.cafe_name },
            attendees: bookings.map((b) => ({
                bookingId: b.id,
                userId: b.user_id,
                name: b.user?.name || "نامشخص",
                phone: b.user?.mobileNumber,
                attended: b.attended,
                attendanceMarkedAt: b.attendance_marked_at,
            })),
        };
    }
    async markAttendance(eventId, cafeId, attendances) {
        const cafe = await this.cafeRepo.findOne({ where: { id: cafeId } });
        if (!cafe)
            throw new common_1.NotFoundException("کافه یافت نشد");
        const event = await this.eventRepo.findOne({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException("رویداد یافت نشد");
        if (event.city !== cafe.city)
            throw new common_1.UnauthorizedException("دسترسی غیرمجاز");
        let count = 0;
        for (const a of attendances) {
            const booking = await this.bookingRepo.findOne({
                where: { event_id: eventId, user_id: a.userId },
            });
            if (!booking)
                continue;
            booking.attended = a.attended;
            booking.attendance_marked_at = new Date();
            await this.bookingRepo.save(booking);
            count++;
        }
        this.logger.log(`Cafe ${cafe.cafe_name} marked ${count} attendances for event ${eventId}`);
        return { success: true, marked: count };
    }
    async createCafe(data) {
        const password_hash = await bcrypt.hash(data.password, 10);
        const cafe = this.cafeRepo.create({ ...data, password_hash });
        return await this.cafeRepo.save(cafe);
    }
    async listCafes() {
        const cafes = await this.cafeRepo.find({ order: { created_at: "DESC" } });
        return cafes.map((c) => ({
            id: c.id,
            username: c.username,
            cafe_name: c.cafe_name,
            city: c.city,
            address: c.address,
            price_tier: c.price_tier,
            is_active: c.is_active,
            telegram_linked: !!c.telegram_id,
            telegram_id: c.telegram_id,
        }));
    }
    /**
     * کافه‌های لینک‌شده به تلگرام در یک شهر
     * n8n از این اندپوینت استفاده می‌کنه تا بدونه کدوم کافه‌ها رو نوتیفای کنه
     */
    async getLinkedCafesByCity(city) {
        const cafes = await this.cafeRepo.find({
            where: { city, is_active: true },
        });
        return cafes
            .filter((c) => !!c.telegram_id)
            .map((c) => ({
            cafeId: c.id,
            cafeName: c.cafe_name,
            telegramId: c.telegram_id,
            city: c.city,
        }));
    }
    /**
     * همه کافه‌های لینک‌شده به تلگرام (برای نوتیفیکیشن دستی)
     */
    async getAllLinkedCafes() {
        const cafes = await this.cafeRepo.find({ where: { is_active: true } });
        return cafes
            .filter((c) => !!c.telegram_id)
            .map((c) => ({
            cafeId: c.id,
            cafeName: c.cafe_name,
            telegramId: c.telegram_id,
            city: c.city,
        }));
    }
    async toggleCafe(cafeId, active) {
        await this.cafeRepo.update(cafeId, { is_active: active });
        return { success: true };
    }
    async computeVenuePriceTier(eventId) {
        const bookings = await this.bookingRepo.find({
            where: { event_id: eventId, payment_status: "paid" },
        });
        const counts = { budget: 0, medium: 0, expensive: 0 };
        for (const b of bookings) {
            const p = b.metadata?.price_preference;
            if (p === "budget" || p === "medium" || p === "expensive")
                counts[p]++;
        }
        const total = counts.budget + counts.medium + counts.expensive;
        if (total === 0)
            return "medium";
        const avg = (counts.budget * 1 + counts.medium * 2 + counts.expensive * 3) / total;
        if (avg < 1.67)
            return "budget";
        if (avg < 2.34)
            return "medium";
        return "expensive";
    }
};
exports.CafeAccessService = CafeAccessService;
exports.CafeAccessService = CafeAccessService = CafeAccessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cafe_access_entity_1.CafeAccess)),
    __param(1, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(2, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], CafeAccessService);
