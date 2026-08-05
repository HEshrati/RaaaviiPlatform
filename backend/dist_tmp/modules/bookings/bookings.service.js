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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const booking_entity_1 = require("./entities/booking.entity");
const event_entity_1 = require("../events/entities/event.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const payment_service_1 = require("../payment/payment.service");
let BookingsService = class BookingsService {
    constructor(bookingRepository, eventRepository, paymentRepository, dataSource, paymentService) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.paymentRepository = paymentRepository;
        this.dataSource = dataSource;
        this.paymentService = paymentService;
    }
    async create(userId, createBookingDto) {
        const { eventId, quantity = 1, plusOneUserId, notes } = createBookingDto;
        const event = await this.eventRepository.findOne({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException('رویداد یافت نشد');
        const totalSlots = quantity + (plusOneUserId ? 1 : 0);
        if ((event.current_bookings || 0) + totalSlots > event.capacity)
            throw new common_1.BadRequestException('ظرفیت رویداد تکمیل شده است');
        // رزرو تکراری
        const existing = await this.bookingRepository.findOne({
            where: { event_id: eventId, user_id: userId },
        });
        if (existing && existing.status !== 'cancelled')
            throw new common_1.BadRequestException('قبلاً این رویداد را رزرو کرده‌اید');
        const bookingCode = 'RAV-' + Date.now().toString(36).toUpperCase() +
            Math.random().toString(36).substring(2, 6).toUpperCase();
        const booking = this.bookingRepository.create({
            user_id: userId,
            event_id: eventId,
            status: 'pending',
            payment_status: 'unpaid',
            matching_status: 'matching_pending',
            booking_code: bookingCode,
            amount_paid: event.price * totalSlots,
            metadata: { notes, plusOneUserId, quantity },
        });
        const savedBooking = (await this.bookingRepository.save(booking));
        // رزرو رایگان
        if (!event.price || event.price <= 0) {
            await this.bookingRepository.update(savedBooking.id, {
                status: 'confirmed',
                payment_status: 'free',
                confirmed_at: new Date(),
            });
            await this.eventRepository.increment({ id: eventId }, 'current_bookings', totalSlots);
            // ورود به match_queue
            await this._addToMatchQueue(eventId, userId);
            // log journey
            await this._logJourney(userId, 'reservation_created', 'reservation', savedBooking.id, { eventId });
            return { id: savedBooking.id, bookingCode, paymentUrl: null, isFree: true, status: 'confirmed' };
        }
        try {
            const paymentResult = await this.paymentService.requestPayment({
                userId,
                bookingId: savedBooking.id,
                amount: event.price * totalSlots,
                description: 'رزرو راوی - ' + (event.title || ''),
            });
            await this._logJourney(userId, 'reservation_created', 'reservation', savedBooking.id, { eventId });
            return {
                id: savedBooking.id,
                bookingCode: savedBooking.booking_code,
                paymentUrl: paymentResult.paymentUrl,
                authority: paymentResult.authority,
            };
        }
        catch (err) {
            return {
                id: savedBooking.id,
                bookingCode: savedBooking.booking_code,
                paymentUrl: null,
                error: err.message || 'خطا در اتصال به درگاه پرداخت',
            };
        }
    }
    // بعد از تایید پرداخت — این متد از payment service صدا زده می‌شه
    async confirmPayment(bookingId) {
        const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
        if (!booking)
            return;
        await this.bookingRepository.update(bookingId, {
            status: 'confirmed',
            payment_status: 'paid',
            matching_status: 'matching_pending',
            confirmed_at: new Date(),
        });
        await this.eventRepository.increment({ id: booking.event_id }, 'current_bookings', 1);
        await this._addToMatchQueue(booking.event_id, booking.user_id);
        await this._logJourney(booking.user_id, 'payment_completed', 'reservation', bookingId, {});
    }
    async findAll(userId) {
        return this.bookingRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: 200,
        });
    }
    async findByUserId(userId, filters) {
        const where = { user_id: userId };
        if (filters?.status)
            where.status = filters.status;
        return this.bookingRepository.find({ where, order: { created_at: 'DESC' }, take: 200 });
    }
    async findOne(id, userId) {
        const booking = await this.bookingRepository.findOne({ where: { id, user_id: userId } });
        if (!booking)
            throw new common_1.NotFoundException('رزرو یافت نشد');
        return booking;
    }
    // رویدادهای من با وضعیت کامل
    async getMyEvents(userId) {
        const rows = await this.dataSource.query(`SELECT
         b.id AS booking_id, b.status, b.matching_status, b.group_id,
         b.payment_status, b.created_at, b.confirmed_at,
         e.id AS event_id, e.title, e.start_date, e.end_date,
         e.city, e.is_online, e.location, e.cover_image, e.image_url, e.type, e.event_type
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE b.user_id = $1
       ORDER BY e.start_date DESC`, [userId]);
        const now = new Date();
        const upcoming = rows.filter((r) => new Date(r.start_date) > now && r.status !== 'cancelled');
        const past = rows.filter((r) => new Date(r.start_date) <= now && r.status !== 'cancelled');
        const pending = rows.filter((r) => r.status === 'pending');
        const cancelled = rows.filter((r) => r.status === 'cancelled');
        return { upcoming, past, pending, cancelled };
    }
    async cancel(id, userId, reason) {
        const booking = await this.findOne(id, userId);
        if (booking.status === 'cancelled')
            throw new common_1.BadRequestException('این رزرو قبلاً لغو شده است');
        booking.status = 'cancelled';
        if (reason)
            booking.cancellation_reason = reason;
        booking.cancelled_at = new Date();
        const saved = await this.bookingRepository.save(booking);
        await this._logJourney(userId, 'reservation_cancelled', 'reservation', id, { reason });
        return saved;
    }
    async cancelBooking(id, userId, reason) {
        return this.cancel(id, userId, reason);
    }
    async updateStatus(id, status) {
        const booking = await this.bookingRepository.findOne({ where: { id } });
        if (!booking)
            throw new common_1.NotFoundException('رزرو یافت نشد');
        booking.status = status;
        return this.bookingRepository.save(booking);
    }
    // ── private helpers ──────────────────────────────────────────
    async _addToMatchQueue(eventId, userId) {
        await this.dataSource.query(`INSERT INTO match_queue (event_id, user_id, status, joined_at)
       VALUES ($1, $2, 'waiting', NOW())
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'waiting'`, [eventId, userId]).catch(() => { });
    }
    async _logJourney(userId, eventName, entityType, entityId, payload) {
        await this.dataSource.query(`INSERT INTO user_journey_events (user_id, event_name, journey_type, entity_type, entity_id, payload)
       VALUES ($1, $2, 'reservation', $3, $4, $5)`, [userId, eventName, entityType, entityId, JSON.stringify(payload)]).catch(() => { });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(1, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(3, (0, typeorm_2.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.DataSource,
        payment_service_1.PaymentService])
], BookingsService);
