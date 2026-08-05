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
exports.FacilitatorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const FACILITATOR_DOMAINS = [
    'هنر و خلاقیت', 'فناوری و نوآوری', 'توسعه فردی', 'کتاب و ادبیات',
    'بازی و سرگرمی', 'موسیقی', 'طبیعت‌گردی', 'آشپزی', 'ورزش', 'سینما',
];
let FacilitatorService = class FacilitatorService {
    constructor(ds) {
        this.ds = ds;
    }
    getDomains() { return { domains: FACILITATOR_DOMAINS }; }
    async registerProfile(userId, data) {
        const existing = await this.ds.query(`SELECT id FROM facilitator_profiles WHERE user_id = $1`, [userId]);
        if (existing.length) {
            await this.ds.query(`
        UPDATE facilitator_profiles SET
          first_name=$1, last_name=$2, national_id=$3, city=$4, bio=$5,
          domains=$6, event_experience=$7, portfolio_url=$8, sample_events=$9,
          status='profile_incomplete', updated_at=NOW()
        WHERE user_id=$10
      `, [data.firstName, data.lastName, data.nationalId, data.city, data.bio || '',
                JSON.stringify(data.domains), data.eventExperience || '',
                data.portfolioUrl || '', JSON.stringify(data.sampleEvents || []), userId]);
            return { success: true, message: 'پروفایل به‌روز شد' };
        }
        await this.ds.query(`
      INSERT INTO facilitator_profiles
        (user_id, first_name, last_name, national_id, city, bio,
         domains, event_experience, portfolio_url, sample_events, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'profile_incomplete')
    `, [userId, data.firstName, data.lastName, data.nationalId, data.city, data.bio || '',
            JSON.stringify(data.domains), data.eventExperience || '',
            data.portfolioUrl || '', JSON.stringify(data.sampleEvents || [])]);
        return { success: true, message: 'پروفایل ثبت شد. لطفاً مرامنامه را بپذیرید' };
    }
    async acceptManifesto(userId) {
        const rows = await this.ds.query(`SELECT id, status FROM facilitator_profiles WHERE user_id = $1`, [userId]);
        if (!rows.length)
            throw new common_1.BadRequestException('ابتدا پروفایل را تکمیل کنید');
        await this.ds.query(`
      UPDATE facilitator_profiles SET
        accepted_manifesto=true, accepted_manifesto_at=NOW(),
        status='pending_review', submitted_at=NOW(), updated_at=NOW()
      WHERE user_id=$1
    `, [userId]);
        return { success: true, message: 'مرامنامه پذیرفته شد. پروفایل در انتظار بررسی است' };
    }
    async getMyProfile(userId) {
        const rows = await this.ds.query(`SELECT * FROM facilitator_profiles WHERE user_id = $1`, [userId]);
        return rows[0] || null;
    }
    async updateMyProfile(userId, data) {
        const rows = await this.ds.query(`SELECT id FROM facilitator_profiles WHERE user_id = $1`, [userId]);
        if (!rows.length)
            throw new common_1.NotFoundException('پروفایل یافت نشد');
        const fields = Object.keys(data)
            .filter(k => ['bio', 'city', 'domains', 'event_experience', 'portfolio_url', 'sample_events'].includes(k));
        if (!fields.length)
            return { success: true };
        const sets = fields.map((k, i) => `${k}=$${i + 2}`).join(',');
        await this.ds.query(`UPDATE facilitator_profiles SET ${sets}, updated_at=NOW() WHERE user_id=$1`, [userId, ...fields.map(k => typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k])]);
        return { success: true };
    }
    async getStatus(userId) {
        const rows = await this.ds.query(`SELECT status, accepted_manifesto, submitted_at FROM facilitator_profiles WHERE user_id=$1`, [userId]);
        if (!rows.length)
            return { status: 'not_started' };
        const { status, accepted_manifesto } = rows[0];
        const messages = {
            profile_incomplete: accepted_manifesto ? 'پروفایل ناقص است' : 'لطفاً مرامنامه را بپذیرید',
            pending_review: 'پروفایل در انتظار بررسی است',
            approved: 'پروفایل تایید شده ✅',
            rejected: 'پروفایل رد شده است',
            needs_revision: 'نیاز به اصلاح دارد',
        };
        return { status, message: messages[status] || '' };
    }
    // ── Admin ──
    async getAllForAdmin(status) {
        let q = `SELECT fp.*, u.name, u."mobileNumber" FROM facilitator_profiles fp JOIN users u ON u.id=fp.user_id`;
        const params = [];
        if (status) {
            params.push(status);
            q += ` WHERE fp.status=$1`;
        }
        q += ' ORDER BY fp.created_at DESC';
        return this.ds.query(q, params);
    }
    async approveByAdmin(id, note) {
        await this.ds.query(`UPDATE facilitator_profiles SET status='approved', admin_note=$1, approved_at=NOW(), updated_at=NOW() WHERE id=$2`, [note || '', id]);
        return { success: true };
    }
    async rejectByAdmin(id, reason) {
        await this.ds.query(`UPDATE facilitator_profiles SET status='rejected', rejected_reason=$1, admin_note=$1, updated_at=NOW() WHERE id=$2`, [reason, id]);
        return { success: true };
    }
};
exports.FacilitatorService = FacilitatorService;
exports.FacilitatorService = FacilitatorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], FacilitatorService);
