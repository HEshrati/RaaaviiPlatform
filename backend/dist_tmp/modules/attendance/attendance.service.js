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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("../events/entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const feedback_entity_1 = require("../feedbacks/entities/feedback.entity");
let AttendanceService = class AttendanceService {
    constructor(eventsRepo, bookingsRepo, usersRepo, feedbacksRepo) {
        this.eventsRepo = eventsRepo;
        this.bookingsRepo = bookingsRepo;
        this.usersRepo = usersRepo;
        this.feedbacksRepo = feedbacksRepo;
    }
    /**
     * ادمین: گرفتن لیست حضور و غیاب یک رویداد
     */
    async getAttendanceList(eventId) {
        const event = await this.eventsRepo.findOne({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException('رویداد یافت نشد');
        const bookings = await this.bookingsRepo.find({
            where: { event_id: eventId, status: (0, typeorm_2.Not)('cancelled') },
            relations: ['user', 'user.profile'],
        });
        const now = new Date();
        const eventEnded = new Date(event.end_date) < now;
        const eventStarted = new Date(event.start_date) < now;
        return {
            event: {
                id: event.id,
                title: event.title,
                start_date: event.start_date,
                end_date: event.end_date,
                location: event.location,
                city: event.city,
                capacity: event.capacity,
                eventEnded,
                eventStarted,
            },
            attendees: bookings.map((b) => ({
                bookingId: b.id,
                userId: b.user_id,
                name: b.user?.name || 'نامشخص',
                phone: b.user?.mobileNumber,
                avatar: b.user?.profile?.avatar_url || b.user?.avatar,
                status: b.status,
                attended: b.attended,
                attendanceMarkedAt: b.attendance_marked_at,
                warningCount: b.user?.warning_count || 0,
                isBanned: b.user?.isBanned || false,
            })),
            summary: {
                total: bookings.length,
                attended: bookings.filter((b) => b.attended).length,
                notAttended: bookings.filter((b) => !b.attended && b.attendance_marked_at).length,
                notMarked: bookings.filter((b) => !b.attendance_marked_at).length,
            },
        };
    }
    /**
     * ادمین: ثبت حضور یا غیاب برای یک شرکت‌کننده
     */
    async markAttendance(eventId, userId, attended, adminId) {
        const event = await this.eventsRepo.findOne({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException('رویداد یافت نشد');
        const now = new Date();
        if (new Date(event.start_date) > now) {
            throw new common_1.BadRequestException('رویداد هنوز شروع نشده - حضور و غیاب فقط بعد از شروع رویداد ثبت می‌شه');
        }
        const booking = await this.bookingsRepo.findOne({
            where: { event_id: eventId, user_id: userId, status: (0, typeorm_2.Not)('cancelled') },
            relations: ['user'],
        });
        if (!booking)
            throw new common_1.NotFoundException('رزرو برای این کاربر یافت نشد');
        const wasAlreadyMarked = !!booking.attendance_marked_at;
        booking.attended = attended;
        booking.attendance_marked_at = new Date();
        await this.bookingsRepo.save(booking);
        // اگر غیاب بود، بررسی و هشدار/بن
        if (!attended && !wasAlreadyMarked) {
            await this.handleNoShow(booking.user, eventId);
        }
        return {
            success: true,
            bookingId: booking.id,
            userId,
            attended,
            message: attended ? '✅ حضور ثبت شد' : '⚠️ غیاب ثبت شد',
        };
    }
    /**
     * ثبت غیاب به صورت دسته‌ای (بعد از اتمام رویداد)
     */
    async bulkMarkAttendance(eventId, attendances, adminId) {
        const results = await Promise.all(attendances.map((a) => this.markAttendance(eventId, a.userId, a.attended, adminId).catch((e) => ({
            userId: a.userId,
            error: e.message,
        }))));
        // بعد از ثبت همه، بررسی آیا رویداد تموم شده و رتینگ ارسال بشه
        const event = await this.eventsRepo.findOne({ where: { id: eventId } });
        if (event && new Date(event.end_date) < new Date()) {
            await this.triggerRatingRequest(eventId);
        }
        return { results };
    }
    /**
     * منطق هشدار و بن برای غیاب
     */
    async handleNoShow(user, eventId) {
        if (!user)
            return;
        // شمارش غیاب‌های تایید شده (بدون کنسل)
        const noShowCount = await this.bookingsRepo.count({
            where: { user_id: user.id, attended: false },
        });
        // به‌روزرسانی تعداد هشدار
        await this.usersRepo.update(user.id, {
            // @ts-ignore - فیلد اضافه شده توسط migration
            warning_count: noShowCount,
        });
        if (noShowCount === 1) {
            // هشدار اول - ارسال اعلان (در محیط واقعی: ارسال SMS/notification)
            // TODO: ارسال SMS هشدار
        }
        else if (noShowCount >= 2) {
            // بن اکانت
            await this.usersRepo.update(user.id, { isBanned: true });
            // TODO: ارسال SMS بن
        }
    }
    /**
     * ارسال درخواست رتینگ به شرکت‌کنندگان بعد از اتمام رویداد
     */
    async triggerRatingRequest(eventId) {
        const attendedBookings = await this.bookingsRepo.find({
            where: { event_id: eventId, attended: true },
            relations: ['user'],
        });
        // برای هر شرکت‌کننده، لیست بقیه شرکت‌کنندگان رو برمی‌گردونه تا بتونه رتینگ بده
        const participants = attendedBookings.map((b) => ({
            userId: b.user_id,
            name: b.user?.name,
        }));
        return {
            eventId,
            participants,
            message: 'درخواست رتینگ ارسال شد',
        };
    }
    /**
     * کاربر: دادن ستاره به شرکت‌کنندگان همنشینی
     */
    async submitRating(eventId, fromUserId, ratings) {
        const event = await this.eventsRepo.findOne({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException('رویداد یافت نشد');
        if (new Date(event.end_date) > new Date()) {
            throw new common_1.BadRequestException('رویداد هنوز تموم نشده');
        }
        // بررسی اینکه کاربر در رویداد شرکت کرده
        const myBooking = await this.bookingsRepo.findOne({
            where: { event_id: eventId, user_id: fromUserId, attended: true },
        });
        if (!myBooking) {
            throw new common_1.ForbiddenException('فقط شرکت‌کنندگان می‌تونن رتینگ بدن');
        }
        const savedFeedbacks = [];
        for (const rating of ratings) {
            if (rating.targetUserId === fromUserId)
                continue; // به خودت رتینگ نمیدی
            if (rating.stars < 1 || rating.stars > 5)
                continue;
            // بررسی تکراری نبودن
            const existing = await this.feedbacksRepo.findOne({
                where: {
                    event_id: eventId,
                    user_id: fromUserId,
                    target_id: rating.targetUserId,
                },
            });
            if (existing)
                continue;
            const feedback = this.feedbacksRepo.create({
                event_id: eventId,
                user_id: fromUserId,
                target_id: rating.targetUserId,
                rating: rating.stars,
                behavioral_tags: rating.tags || [],
                is_anonymous: false,
            });
            savedFeedbacks.push(await this.feedbacksRepo.save(feedback));
        }
        return {
            success: true,
            count: savedFeedbacks.length,
            message: `${savedFeedbacks.length} رتینگ با موفقیت ثبت شد`,
        };
    }
    /**
     * گرفتن وضعیت رتینگ کاربر برای یک رویداد (آیا باید popup نشون داده بشه)
     */
    async getRatingStatus(eventId, userId) {
        const event = await this.eventsRepo.findOne({ where: { id: eventId } });
        if (!event)
            return { shouldRate: false };
        const eventEnded = new Date(event.end_date) < new Date();
        if (!eventEnded)
            return { shouldRate: false };
        // بررسی اینکه کاربر در رویداد بوده
        const myBooking = await this.bookingsRepo.findOne({
            where: { event_id: eventId, user_id: userId, attended: true },
        });
        if (!myBooking)
            return { shouldRate: false };
        // بررسی اینکه قبلاً رتینگ داده یا نه
        const existingFeedbacks = await this.feedbacksRepo.find({
            where: { event_id: eventId, user_id: userId },
        });
        // گرفتن لیست بقیه شرکت‌کنندگان
        const otherAttendees = await this.bookingsRepo.find({
            where: { event_id: eventId, attended: true },
            relations: ['user'],
        });
        const participants = otherAttendees
            .filter((b) => b.user_id !== userId)
            .map((b) => ({
            userId: b.user_id,
            name: b.user?.name || 'نامشخص',
            avatar: b.user?.avatar,
            alreadyRated: existingFeedbacks.some((f) => f.target_id === b.user_id),
        }));
        const allRated = participants.every((p) => p.alreadyRated);
        return {
            shouldRate: participants.length > 0 && !allRated,
            participants,
            event: {
                id: event.id,
                title: event.title,
                end_date: event.end_date,
            },
        };
    }
    /**
     * آمار حضور برای داشبورد ادمین
     */
    async getAdminAttendanceDashboard(adminId) {
        const events = await this.eventsRepo.find({
            where: { created_by: adminId, is_active: true },
            order: { start_date: 'DESC' },
        });
        const now = new Date();
        const eventStats = await Promise.all(events.map(async (ev) => {
            const bookings = await this.bookingsRepo.find({
                where: { event_id: ev.id, status: (0, typeorm_2.Not)('cancelled') },
            });
            const attended = bookings.filter((b) => b.attended).length;
            const noShow = bookings.filter((b) => !b.attended && b.attendance_marked_at).length;
            const pending = bookings.filter((b) => !b.attendance_marked_at).length;
            return {
                eventId: ev.id,
                title: ev.title,
                start_date: ev.start_date,
                end_date: ev.end_date,
                city: ev.city,
                category: ev.category || ev.event_type,
                isCompleted: new Date(ev.end_date) < now,
                isStarted: new Date(ev.start_date) < now,
                stats: {
                    total: bookings.length,
                    attended,
                    noShow,
                    pending,
                    attendanceRate: bookings.length > 0 ? Math.round((attended / bookings.length) * 100) : 0,
                },
            };
        }));
        const completedEvents = eventStats.filter((e) => e.isCompleted);
        const avgAttendance = completedEvents.length > 0
            ? Math.round(completedEvents.reduce((s, e) => s + e.stats.attendanceRate, 0) /
                completedEvents.length)
            : 0;
        return {
            events: eventStats,
            summary: {
                totalEvents: events.length,
                completedEvents: completedEvents.length,
                upcomingEvents: eventStats.filter((e) => !e.isStarted).length,
                avgAttendanceRate: avgAttendance,
            },
        };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(feedback_entity_1.Feedback)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AttendanceService);
