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
exports.AdminController = exports.ADMIN_PHONES = void 0;
exports.isAdminUser = isAdminUser;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const user_entity_1 = require("../users/entities/user.entity");
const event_entity_1 = require("../events/entities/event.entity");
const booking_entity_1 = require("../bookings/entities/booking.entity");
const profile_entity_1 = require("../profiles/entities/profile.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
// همان لیست ادمین‌ها
exports.ADMIN_PHONES = [
    '09929564895',
    '09356815523',
    '09933830958',
];
function isAdminUser(user) {
    if (!user)
        return false;
    const raw = user?.mobileNumber || user?.phone_number || '';
    const phone = raw.replace(/[\s\-+]/g, '').replace(/^98/, '0');
    return exports.ADMIN_PHONES.includes(phone);
}
function requireAdmin(user) {
    if (!isAdminUser(user))
        throw new common_1.ForbiddenException('دسترسی ادمین لازم است');
}
let AdminController = class AdminController {
    constructor(usersRepo, eventsRepo, bookingsRepo, profilesRepo, paymentsRepo) {
        this.usersRepo = usersRepo;
        this.eventsRepo = eventsRepo;
        this.bookingsRepo = bookingsRepo;
        this.profilesRepo = profilesRepo;
        this.paymentsRepo = paymentsRepo;
    }
    // ── آمار ادمین ─────────────────────────────────────────────────
    async getStats(req) {
        requireAdmin(req.user);
        try {
            const [totalUsers, totalEvents, totalBookings] = await Promise.all([
                this.usersRepo.count(),
                this.eventsRepo.count({ where: { is_active: true } }),
                this.bookingsRepo.count(),
            ]);
            const allBookings = await this.bookingsRepo.find({
                order: { confirmed_at: 'DESC' },
            });
            const completedBookings = allBookings.filter((b) => b.payment_status === 'paid' || b.status === 'confirmed');
            const attended = allBookings.filter((b) => b.attended).length;
            const avgSuccessRate = totalBookings > 0 ? Math.round((attended / totalBookings) * 100) : 0;
            return { totalUsers, totalEvents, totalBookings, avgSuccessRate };
        }
        catch {
            return { totalUsers: 0, totalEvents: 0, totalBookings: 0, avgSuccessRate: 0 };
        }
    }
    // ── آنالیتیکس کامل ──────────────────────────────────────────────
    async getAnalytics(req) {
        requireAdmin(req.user);
        try {
            const [totalUsers, totalEvents] = await Promise.all([
                this.usersRepo.count(),
                this.eventsRepo.count({ where: { is_active: true } }),
            ]);
            const allBookings = await this.bookingsRepo.find({
                order: { confirmed_at: 'DESC' },
            });
            const totalBookings = allBookings.length;
            // Revenue
            const allPayments = await this.paymentsRepo.find({ where: { status: 'completed' } });
            const totalRevenue = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            // Bookings per month (last 6 months)
            const now = new Date();
            const bookingsPerMonth = Array.from({ length: 6 }).map((_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
                const label = d.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' });
                const count = allBookings.filter((b) => {
                    const bd = new Date(b.confirmed_at || b.created_at || '');
                    return bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth();
                }).length;
                return { month: label, count };
            });
            // Revenue per month
            const revenuePerMonth = Array.from({ length: 6 }).map((_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
                const label = d.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' });
                const revenue = allPayments
                    .filter((p) => {
                    const pd = new Date(p.created_at || '');
                    return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
                })
                    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                return { month: label, revenue };
            });
            // Category breakdown
            const allEvents = await this.eventsRepo.find();
            const catMap = {};
            for (const ev of allEvents) {
                const cat = ev.category || ev.event_type || 'سایر';
                catMap[cat] = (catMap[cat] || 0) + 1;
            }
            const categoryBreakdown = Object.entries(catMap).map(([category, count]) => ({ category, count }));
            // Top events by bookings
            const eventsWithBookings = await Promise.all(allEvents.slice(0, 10).map(async (ev) => {
                const bookings = allBookings.filter((b) => b.event_id === ev.id);
                const revenue = bookings.reduce((s, b) => s + Number(b.amount_paid || 0), 0);
                return { title: ev.title, bookings: bookings.length, revenue };
            }));
            const topEvents = eventsWithBookings.sort((a, b) => b.bookings - a.bookings).slice(0, 5);
            // User growth (last 6 months)
            const allUsers = await this.usersRepo.find({ order: { createdAt: "DESC" }, take: 500 });
            const userGrowth = Array.from({ length: 6 }).map((_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
                const label = d.toLocaleDateString('fa-IR', { month: 'long' });
                const count = allUsers.filter((u) => {
                    const ud = new Date(u.createdAt || '');
                    return ud.getFullYear() === d.getFullYear() && ud.getMonth() === d.getMonth();
                }).length;
                return { month: label, count };
            });
            return {
                totalUsers,
                totalBookings,
                totalRevenue,
                totalEvents,
                bookingsPerMonth,
                categoryBreakdown,
                revenuePerMonth,
                topEvents,
                userGrowth,
            };
        }
        catch (err) {
            console.error('Admin analytics error:', err);
            return {
                totalUsers: 0, totalBookings: 0, totalRevenue: 0, totalEvents: 0,
                bookingsPerMonth: [], categoryBreakdown: [], revenuePerMonth: [], topEvents: [],
                userGrowth: [],
            };
        }
    }
    // ── آمار همنشینی‌ها ───────────────────────────────────────────
    async getEventStats(req) {
        requireAdmin(req.user);
        const events = await this.eventsRepo.find({
            where: { is_active: true },
            order: { created_at: 'DESC' },
        });
        const now = new Date();
        const eventStats = await Promise.all(events.map(async (ev) => {
            const bookings = await this.bookingsRepo.find({ where: { event_id: ev.id } });
            const attended = bookings.filter((b) => b.attended).length;
            const reserved = bookings.length;
            const successRate = reserved > 0 ? Math.round((attended / reserved) * 100) : 0;
            return {
                eventId: ev.id,
                title: ev.title,
                capacity: ev.capacity,
                reserved,
                attended,
                successRate,
                date: new Date(ev.start_date).toLocaleDateString('fa-IR'),
                isActive: new Date(ev.end_date) > now,
            };
        }));
        const avgSuccessRate = eventStats.length > 0
            ? Math.round(eventStats.reduce((s, e) => s + e.successRate, 0) / eventStats.length)
            : 0;
        return { events: eventStats, totalEvents: events.length, avgSuccessRate };
    }
    // ── لیست کاربران (با فیلتر شهر) ────────────────────────────────
    async getUsers(req, city, page = 1, limit = 20) {
        requireAdmin(req.user);
        try {
            const skip = (Number(page) - 1) * Number(limit);
            const [users, total] = await this.usersRepo.findAndCount({
                order: { createdAt: 'DESC' },
                skip,
                take: Number(limit),
            });
            // Enrich with profile data (city)
            const enriched = await Promise.all(users.map(async (u) => {
                const profile = await this.profilesRepo.findOne({ where: { user_id: u.id } }).catch(() => null);
                const userCity = profile?.city || '';
                const bookingCount = await this.bookingsRepo.count({ where: { user_id: u.id } }).catch(() => 0);
                return {
                    id: u.id,
                    name: u.name || '',
                    mobileNumber: u.mobileNumber,
                    city: userCity,
                    role: u.role,
                    isTestTaken: u.isTestTaken,
                    createdAt: u.createdAt,
                    bookingCount,
                };
            }));
            const filtered = city ? enriched.filter((u) => u.city === city) : enriched;
            return { users: filtered, total: city ? filtered.length : total };
        }
        catch (err) {
            console.error('Admin users error:', err);
            return { users: [], total: 0 };
        }
    }
    // ── پروفایل کاربر برای ادمین ───────────────────────────────────
    async getUserProfile(req, id) {
        requireAdmin(req.user);
        const user = await this.usersRepo.findOne({ where: { id } });
        const profile = await this.profilesRepo.findOne({ where: { user_id: id } }).catch(() => null);
        const bookings = await this.bookingsRepo.find({ where: { user_id: id } }).catch(() => []);
        return { user, profile, bookingCount: bookings.length, bookings };
    }
    // ── لیست همه رزروها (ادمین) ────────────────────────────────────
    async getAllBookings(req, eventId, status, page = 1, limit = 30) {
        requireAdmin(req.user);
        try {
            const where = {};
            if (eventId)
                where.event_id = eventId;
            if (status)
                where.status = status;
            const skip = (Number(page) - 1) * Number(limit);
            const [bookings, total] = await this.bookingsRepo.findAndCount({
                where,
                order: { confirmed_at: 'DESC' },
                skip,
                take: Number(limit),
                relations: ['user', 'event'],
            });
            return { bookings, total };
        }
        catch {
            return { bookings: [], total: 0 };
        }
    }
    // ── تغییر وضعیت رزرو ────────────────────────────────────────────
    async updateBooking(req, id, body) {
        requireAdmin(req.user);
        const booking = await this.bookingsRepo.findOne({ where: { id } });
        if (!booking)
            throw new common_1.ForbiddenException('رزرو یافت نشد');
        if (body.status)
            booking.status = body.status;
        if (body.payment_status)
            booking.payment_status = body.payment_status;
        return await this.bookingsRepo.save(booking);
    }
    // ── حذف رزرو ─────────────────────────────────────────────────────
    async deleteBooking(req, id) {
        requireAdmin(req.user);
        await this.bookingsRepo.delete(id);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('event-stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getEventStats", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id/profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserProfile", null);
__decorate([
    (0, common_1.Get)('bookings'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('eventId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllBookings", null);
__decorate([
    (0, common_1.Patch)('bookings/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateBooking", null);
__decorate([
    (0, common_1.Delete)('bookings/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteBooking", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(2, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(3, (0, typeorm_1.InjectRepository)(profile_entity_1.Profile)),
    __param(4, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminController);
