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
exports.CollaborationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let CollaborationService = class CollaborationService {
    constructor(ds) {
        this.ds = ds;
    }
    async registerFacilitator(userId, data, resumeUrl) {
        const { name, phone, city, workField, workArea, availableTimes, bio } = data;
        // چک تکراری
        if (userId) {
            const existing = await this.ds.query('SELECT id FROM facilitator_profiles WHERE user_id=$1', [userId]);
            if (existing?.length) {
                // آپدیت
                await this.ds.query(`
          UPDATE facilitator_profiles SET
            name=$1, phone=$2, city=$3, work_field=$4, work_area=$5,
            available_times=$6, bio=$7, updated_at=NOW()
            ${resumeUrl ? ', resume_url=$9' : ''}
          WHERE user_id=$8
        `, resumeUrl
                    ? [name, phone, city, workField, workArea, availableTimes, bio, userId, resumeUrl]
                    : [name, phone, city, workField, workArea, availableTimes, bio, userId]);
                return { success: true, message: 'پروفایل بروزرسانی شد', updated: true };
            }
        }
        // ثبت جدید
        const res = await this.ds.query(`
      INSERT INTO facilitator_profiles
        (user_id, name, phone, city, work_field, work_area, available_times, bio, resume_url, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
      RETURNING id
    `, [userId, name, phone, city, workField, workArea, availableTimes, bio, resumeUrl]);
        return { success: true, message: 'درخواست تسهیلگری ثبت شد. منتظر تأیید باشید.', id: res[0]?.id };
    }
    async getMyFacilitatorProfile(userId) {
        const rows = await this.ds.query('SELECT * FROM facilitator_profiles WHERE user_id=$1 LIMIT 1', [userId]);
        return rows?.[0] || null;
    }
    async updateFacilitatorProfile(userId, data) {
        const allowed = ['city', 'work_field', 'work_area', 'available_times', 'bio', 'phone'];
        const sets = Object.entries(data)
            .filter(([k]) => allowed.includes(k))
            .map(([k], i) => `${k}=$${i + 2}`)
            .join(', ');
        const vals = Object.entries(data)
            .filter(([k]) => allowed.includes(k))
            .map(([, v]) => v);
        if (!sets)
            return { success: false };
        await this.ds.query(`UPDATE facilitator_profiles SET ${sets}, updated_at=NOW() WHERE user_id=$1`, [userId, ...vals]);
        return { success: true };
    }
    async updateChecklist(userId, item, done) {
        const profile = await this.getMyFacilitatorProfile(userId);
        if (!profile)
            return { success: false };
        const checklist = profile.checklist_done || {};
        checklist[item] = done;
        await this.ds.query('UPDATE facilitator_profiles SET checklist_done=$1, updated_at=NOW() WHERE user_id=$2', [JSON.stringify(checklist), userId]);
        return { success: true, checklist };
    }
    async getAllFacilitators() {
        return this.ds.query('SELECT * FROM facilitator_profiles ORDER BY created_at DESC');
    }
    async approveFacilitator(id, note) {
        await this.ds.query(`UPDATE facilitator_profiles SET status='approved', admin_note=$1, approved_at=NOW() WHERE id=$2`, [note || null, id]);
        return { success: true };
    }
    async rejectFacilitator(id, note) {
        await this.ds.query(`UPDATE facilitator_profiles SET status='rejected', admin_note=$1 WHERE id=$2`, [note, id]);
        return { success: true };
    }
};
exports.CollaborationService = CollaborationService;
exports.CollaborationService = CollaborationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], CollaborationService);
