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
exports.VenueService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const VENUE_TYPES = ['کافه', 'فضای اشتراکی', 'سالن همایش', 'باغ و فضای باز', 'خانه فرهنگ', 'سایر'];
const AMENITIES_OPTIONS = ['Wi-Fi', 'پروژکتور', 'صوت و تصویر', 'پارکینگ', 'آشپزخانه', 'سرویس بهداشتی', 'تهویه مطبوع'];
let VenueService = class VenueService {
    constructor(ds) {
        this.ds = ds;
    }
    getOptions() { return { venue_types: VENUE_TYPES, amenities: AMENITIES_OPTIONS }; }
    async registerVenue(userId, data) {
        const existing = await this.ds.query(`SELECT id FROM venue_profiles WHERE user_id=$1`, [userId]);
        if (existing.length) {
            await this.ds.query(`
        UPDATE venue_profiles SET
          manager_name=$1, venue_name=$2, venue_type=$3, address=$4, city=$5,
          capacity=$6, amenities=$7, working_hours=$8, photos=$9, lat=$10, lng=$11,
          status='profile_incomplete', updated_at=NOW()
        WHERE user_id=$12
      `, [data.managerName, data.venueName, data.venueType, data.address, data.city,
                data.capacity, JSON.stringify(data.amenities || []), JSON.stringify(data.workingHours || {}),
                JSON.stringify(data.photos || []), data.lat || null, data.lng || null, userId]);
            return { success: true, message: 'اطلاعات فضا به‌روز شد' };
        }
        await this.ds.query(`
      INSERT INTO venue_profiles
        (user_id, manager_name, venue_name, venue_type, address, city,
         capacity, amenities, working_hours, photos, lat, lng)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [userId, data.managerName, data.venueName, data.venueType, data.address, data.city,
            data.capacity, JSON.stringify(data.amenities || []), JSON.stringify(data.workingHours || {}),
            JSON.stringify(data.photos || []), data.lat || null, data.lng || null]);
        return { success: true, message: 'فضا ثبت شد. لطفاً شرایط همکاری را بپذیرید' };
    }
    async acceptTerms(userId) {
        const rows = await this.ds.query(`SELECT id FROM venue_profiles WHERE user_id=$1`, [userId]);
        if (!rows.length)
            throw new common_1.BadRequestException('ابتدا اطلاعات فضا را ثبت کنید');
        await this.ds.query(`
      UPDATE venue_profiles SET
        accepted_terms=true, status='pending_review', submitted_at=NOW(), updated_at=NOW()
      WHERE user_id=$1
    `, [userId]);
        return { success: true, message: 'شرایط پذیرفته شد. پروفایل در انتظار بررسی است' };
    }
    async getMyProfile(userId) {
        const rows = await this.ds.query(`SELECT * FROM venue_profiles WHERE user_id=$1`, [userId]);
        return rows[0] || null;
    }
    async updateMyProfile(userId, data) {
        const rows = await this.ds.query(`SELECT id FROM venue_profiles WHERE user_id=$1`, [userId]);
        if (!rows.length)
            throw new common_1.NotFoundException('پروفایل یافت نشد');
        const allowed = ['venue_name', 'venue_type', 'address', 'city', 'capacity', 'amenities', 'working_hours', 'photos', 'lat', 'lng'];
        const fields = Object.keys(data).filter(k => allowed.includes(k));
        if (!fields.length)
            return { success: true };
        const sets = fields.map((k, i) => `${k}=$${i + 2}`).join(',');
        await this.ds.query(`UPDATE venue_profiles SET ${sets}, updated_at=NOW() WHERE user_id=$1`, [userId, ...fields.map(k => typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k])]);
        return { success: true };
    }
    async getStatus(userId) {
        const rows = await this.ds.query(`SELECT status FROM venue_profiles WHERE user_id=$1`, [userId]);
        if (!rows.length)
            return { status: 'not_started' };
        return { status: rows[0].status };
    }
    // پنل میزبانی: رویدادهایی که در این لوکیشن هستند
    async getVenueEvents(userId) {
        const venue = await this.ds.query(`SELECT city, venue_name FROM venue_profiles WHERE user_id=$1`, [userId]);
        if (!venue.length)
            throw new common_1.NotFoundException('پروفایل یافت نشد');
        // رویدادهایی که شهر یکسان دارند (برای MVP)
        return this.ds.query(`
      SELECT e.id, e.title, e.start_date, e.end_date, e.current_bookings, e.capacity, e.city
      FROM events e
      WHERE e.city = $1 AND e.is_active = true AND e.start_date > NOW()
      ORDER BY e.start_date ASC LIMIT 20
    `, [venue[0].city]);
    }
    // Admin
    async getAllForAdmin(status) {
        let q = `SELECT vp.*, u.name, u."mobileNumber" FROM venue_profiles vp JOIN users u ON u.id=vp.user_id`;
        const params = [];
        if (status) {
            params.push(status);
            q += ` WHERE vp.status=$1`;
        }
        q += ' ORDER BY vp.created_at DESC';
        return this.ds.query(q, params);
    }
    async approveByAdmin(id, note) {
        await this.ds.query(`UPDATE venue_profiles SET status='approved', admin_note=$1, approved_at=NOW(), updated_at=NOW() WHERE id=$2`, [note || '', id]);
        return { success: true };
    }
    async rejectByAdmin(id, reason) {
        await this.ds.query(`UPDATE venue_profiles SET status='rejected', rejected_reason=$1, updated_at=NOW() WHERE id=$2`, [reason, id]);
        return { success: true };
    }
};
exports.VenueService = VenueService;
exports.VenueService = VenueService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], VenueService);
