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
exports.PsychologistVerifyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const psychologist_profile_entity_1 = require("./entities/psychologist-profile.entity");
// ─── Trust Score (5 فاکتور) ───────────────────────────────────
async function calcTrustScore(checks) {
    const breakdown = {
        license_exists: checks.licenseExists ? 25 : 0,
        license_active: checks.licenseActive ? 15 : 0,
        name_match: checks.nameMatch ? 20 : 0,
        mobile_national_match: checks.mobileNationalMatch === true ? 20 : 0,
        profile_complete: checks.profileComplete ? 20 : 0,
    };
    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { score, breakdown, needsManualShahkar: checks.mobileNationalMatch === null };
}
let PsychologistVerifyService = class PsychologistVerifyService {
    constructor(profileRepo, ds) {
        this.profileRepo = profileRepo;
        this.ds = ds;
    }
    // ── Blacklist Guard ──────────────────────────────────────────
    async checkBlacklist(mobile) {
        const bl = await this.ds.query(`SELECT 1 FROM professional_blacklist WHERE mobile_number=$1`, [mobile]);
        if (bl.length)
            throw new common_1.BadRequestException('این شماره مسدود شده است. با پشتیبانی تماس بگیرید');
    }
    // ── Rate Limit برای ثبت کد نظام ───────────────────────────────
    async checkRateLimit(mobile) {
        const rows = await this.ds.query(`SELECT * FROM professional_otp_attempts WHERE mobile_number=$1`, [mobile]);
        const rec = rows[0];
        if (rec?.locked_until && new Date(rec.locked_until) > new Date()) {
            throw new common_1.BadRequestException('تعداد تلاش‌های شما بیش از حد است. ۱۵ دقیقه دیگر تلاش کنید');
        }
        if (rec) {
            const newAttempts = (rec.attempts || 0) + 1;
            const locked = newAttempts > 5;
            await this.ds.query(`
        UPDATE professional_otp_attempts SET attempts=$1, last_attempt_at=NOW(),
          locked_until = CASE WHEN $2 THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
        WHERE mobile_number=$3
      `, [locked ? 0 : newAttempts, locked, mobile]);
            if (locked)
                throw new common_1.BadRequestException('تعداد تلاش‌ها بیش از حد مجاز است. ۱۵ دقیقه صبر کنید');
        }
        else {
            await this.ds.query(`INSERT INTO professional_otp_attempts (mobile_number, attempts) VALUES ($1, 1)`, [mobile]);
        }
    }
    // ── Audit Log ────────────────────────────────────────────────
    async logAdminAction(adminId, targetType, targetId, action, reason) {
        await this.ds.query(`
      INSERT INTO admin_action_logs (admin_id, target_type, target_id, action, reason)
      VALUES ($1,$2,$3,$4,$5)
    `, [adminId || null, targetType, targetId, action, reason || null]).catch(() => { });
    }
    // ── IRIMC Lookup ──────────────────────────────────────────────
    async queryIrimc(licenseNumber) {
        const url = `https://membersearch.irimc.org/api/Member/Search?memberNumber=${encodeURIComponent(licenseNumber)}`;
        try {
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(10_000),
            });
            const data = JSON.parse(await res.text());
            const m = Array.isArray(data) ? data[0] : data?.data?.[0] ?? data;
            if (m?.firstName || m?.memberNumber) {
                return {
                    found: true,
                    name: `${m.firstName || ''} ${m.lastName || ''}`.trim(),
                    specialty: m.specialty || m.expertiseName || '',
                    licenseNumber: String(m.memberNumber || licenseNumber),
                    province: m.province || '',
                    status: m.memberStatus || 'فعال',
                };
            }
        }
        catch { }
        return { found: false };
    }
    // ── Shahkar — تطبیق موبایل با کد ملی ───────────────────────────
    // ⚠️ نیاز به SHAHKAR_API_KEY در env دارد. تا دریافت credentials رسمی،
    // این متد همیشه manual:true برمی‌گرداند تا ادمین به‌صورت دستی بررسی کند.
    async checkShahkarMatch(mobile, nationalId) {
        const apiKey = process.env.SHAHKAR_API_KEY;
        if (!apiKey)
            return { matched: false, manual: true };
        try {
            const res = await fetch('https://shahkar.example.ir/api/v1/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({ mobile, nationalId }),
                signal: AbortSignal.timeout(8000),
            });
            const data = await res.json();
            return { matched: !!data.isMatched, manual: false };
        }
        catch {
            return { matched: false, manual: true };
        }
    }
    // ── Step 1: ثبت کد نظام ──────────────────────────────────────
    async verifyLicense(userId, licenseNumber, mobileNumber) {
        await this.checkBlacklist(mobileNumber);
        await this.checkRateLimit(mobileNumber);
        const normalized = licenseNumber.trim().replace(/\s/g, '');
        const existing = await this.profileRepo.findOne({ where: { licenseNumber: normalized } });
        if (existing && existing.userId !== userId)
            throw new common_1.BadRequestException('این کد نظام پزشکی قبلاً توسط حساب دیگری ثبت شده است');
        const profile = existing || this.profileRepo.create({ userId, licenseNumber: normalized, mobileNumber });
        profile.mobileNumber = mobileNumber;
        profile.irirmcStatus = 'manual_review';
        profile.verificationStatus = 'pending_admin';
        await this.profileRepo.save(profile);
        await this.ds.query(`
      INSERT INTO professional_verification_checks
        (psychologist_profile_id, check_type, check_status, notes)
      VALUES ($1, 'license_submitted', 'pending', $2)
    `, [profile.id, `کد نظام ${normalized} ثبت شد`]).catch(() => { });
        return { verified: true, message: 'کد نظام ثبت شد. لطفاً پروفایل خود را تکمیل کنید.', next_step: 'complete_profile' };
    }
    // ── Step 2: تکمیل پروفایل + Trust Score ───────────────────────
    async completeProfile(userId, data) {
        let profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.BadRequestException('ابتدا کد نظام خود را ثبت کنید');
        profile.nameFromIrimc = `${data.firstName} ${data.lastName}`;
        profile.first_name = data.firstName;
        profile.last_name = data.lastName;
        profile.national_id = data.nationalId;
        profile.specialty = data.specialty || '';
        profile.bio = data.bio || '';
        profile.city = data.city || '';
        profile.sessionPrice = data.sessionPrice || 0;
        profile.workingAreas = data.workingAreas || '';
        profile.professional_status = 'profile_submitted';
        profile.submitted_at = new Date();
        await this.profileRepo.save(profile);
        await this.runTrustValidation(profile.id, profile.licenseNumber, `${data.firstName} ${data.lastName}`, profile.mobileNumber, data.nationalId);
        return { success: true, message: 'پروفایل ثبت شد و در حال بررسی است', next_step: 'pending_review' };
    }
    // ── Trust Score Validation (با Shahkar) ────────────────────────
    async runTrustValidation(profileId, licenseNumber, fullName, mobile, nationalId) {
        const irimc = await this.queryIrimc(licenseNumber);
        const shahkar = await this.checkShahkarMatch(mobile, nationalId);
        const nameMatch = irimc.found
            ? fullName.trim().includes(irimc.name?.split(' ')[0] || '')
            : false;
        const { score, breakdown, needsManualShahkar } = await calcTrustScore({
            licenseExists: irimc.found,
            licenseActive: irimc.found && irimc.status !== 'غیرفعال',
            nameMatch,
            mobileNationalMatch: shahkar.manual ? null : shahkar.matched,
            profileComplete: true,
        });
        for (const [type, val] of Object.entries(breakdown)) {
            await this.ds.query(`
        INSERT INTO professional_verification_checks
          (psychologist_profile_id, check_type, check_status, score, provider, raw_response)
        VALUES ($1, $2, $3, $4, 'system', $5)
      `, [profileId, type, val > 0 ? 'passed' : 'failed', val, JSON.stringify({ irimc, shahkar })]).catch(() => { });
        }
        let newStatus = 'pending_admin';
        let autoApproved = false;
        if (score >= 75 && !needsManualShahkar) {
            newStatus = 'approved';
            autoApproved = true;
        }
        else if (score < 40) {
            newStatus = 'needs_revision';
        }
        else if (needsManualShahkar) {
            newStatus = 'needs_admin_review'; // امتیاز خوبه ولی شاهکار نیاز به بررسی دستی دارد
        }
        await this.ds.query(`
      UPDATE psychologist_profiles
      SET trust_score=$1, trust_breakdown=$2, verification_status=$3,
          professional_status=$4, auto_approved_at=$5, public_profile_status=$6
      WHERE id=$7
    `, [
            score, JSON.stringify(breakdown), newStatus,
            autoApproved ? 'active' : 'pending_review',
            autoApproved ? new Date() : null,
            autoApproved ? 'visible' : 'hidden',
            profileId,
        ]);
        return { score, autoApproved, needsManualShahkar };
    }
    // ── آپلود مدارک تحصیلی ─────────────────────────────────────────
    async saveCredentialDocument(userId, file) {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.BadRequestException('ابتدا پروفایل خود را ثبت کنید');
        const url = `/uploads/credentials/${file.filename}`;
        await this.ds.query(`
      UPDATE psychologist_profiles
      SET license_documents = COALESCE(license_documents, '[]'::jsonb) || $1::jsonb
      WHERE id = $2
    `, [JSON.stringify([url]), profile.id]);
        return { success: true, url, message: 'مدرک با موفقیت بارگذاری شد' };
    }
    // ── وضعیت تایید ───────────────────────────────────────────────
    async getVerificationStatus(userId) {
        const p = await this.profileRepo.findOne({ where: { userId } });
        if (!p)
            return { status: 'not_started', can_access_dashboard: false };
        const status = p.professional_status || p.verificationStatus;
        const messages = {
            mobile_verified: 'لطفاً پروفایل خود را تکمیل کنید',
            profile_submitted: 'پروفایل در حال بررسی توسط سیستم است',
            pending_review: 'پروفایل شما در صف بررسی ادمین است',
            pending_admin: 'پروفایل شما در صف بررسی تیم راوی است',
            needs_admin_review: 'سیستم نیاز به بررسی دستی تیم راوی دارد (تطبیق هویت)',
            needs_revision: 'پروفایل نیاز به اصلاح دارد. لطفاً اطلاعات را بررسی کنید',
            approved: 'پروفایل تایید شده است ✅',
            rejected: 'پروفایل رد شده است. با پشتیبانی تماس بگیرید',
            active: 'حساب فعال است ✅',
        };
        return {
            status,
            trust_score: p.trust_score || 0,
            message: messages[status] || 'وضعیت نامشخص',
            can_access_dashboard: ['approved', 'active'].includes(p.verificationStatus),
        };
    }
    // ── ثبت زمان آزاد → تولید Slot → انتشار در همروان ──────────────
    async setAvailability(userId, data) {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('پروفایل روانشناس یافت نشد');
        if (!['approved', 'active'].includes(profile.verificationStatus))
            throw new common_1.BadRequestException('پروفایل شما هنوز تایید نشده است');
        const duration = data.sessionDurationMinutes || profile.default_session_duration || 50;
        const buffer = data.bufferMinutes || profile.default_buffer_minutes || 10;
        const [rule] = await this.ds.query(`
      INSERT INTO psychologist_availability_rules
        (psychologist_id, start_datetime, end_datetime, session_type,
         location_description, session_duration_minutes, buffer_minutes, repeat_type, repeat_until)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
    `, [profile.id, data.startDatetime, data.endDatetime, data.sessionType,
            data.locationDescription || null, duration, buffer, data.repeatType || 'none', data.repeatUntil || null]);
        const slots = await this._generateSlots(rule.id, profile.id, data.startDatetime, data.endDatetime, data.sessionType, data.locationDescription, duration, buffer, data.repeatType, data.repeatUntil);
        return { success: true, rule_id: rule.id, created_slots: slots.length, published_to_hamravan: true,
            message: `${slots.length} اسلات ایجاد و در همروان منتشر شد` };
    }
    async _generateSlots(ruleId, psychId, startStr, endStr, sessionType, location, duration, buffer, repeatType, repeatUntil) {
        const slots = [];
        const baseStart = new Date(startStr);
        const baseEnd = new Date(endStr);
        const until = repeatUntil ? new Date(repeatUntil) : baseStart;
        const dates = [];
        let cur = new Date(baseStart);
        while (cur <= until) {
            dates.push(new Date(cur));
            if (repeatType === 'daily')
                cur.setDate(cur.getDate() + 1);
            else if (repeatType === 'weekly')
                cur.setDate(cur.getDate() + 7);
            else
                break;
        }
        for (const date of dates) {
            const dayEnd = new Date(date);
            dayEnd.setHours(baseEnd.getHours(), baseEnd.getMinutes(), 0, 0);
            let slotStart = new Date(date);
            while (true) {
                const slotEnd = new Date(slotStart.getTime() + duration * 60_000);
                if (slotEnd > dayEnd)
                    break;
                const [row] = await this.ds.query(`
          INSERT INTO psychologist_time_slots
            (psychologist_id, rule_id, start_datetime, end_datetime, session_type, location_description, status, publish_to_hamravan)
          VALUES ($1,$2,$3,$4,$5,$6,'available',true) RETURNING id
        `, [psychId, ruleId, slotStart.toISOString(), slotEnd.toISOString(), sessionType, location || null]);
                if (row?.id)
                    slots.push(row.id);
                slotStart = new Date(slotEnd.getTime() + buffer * 60_000);
            }
        }
        return slots;
    }
    async getAvailableSlots(psychologistUserId, city) {
        let query = `
      SELECT pts.id as slot_id, pts.start_datetime, pts.end_datetime, pts.session_type, pts.location_description,
        pp.id as psychologist_id, pp.user_id, pp.specialty, pp.bio, pp.session_price, pp.city,
        pp.rating, pp.total_sessions,
        COALESCE(pp.first_name,'') || ' ' || COALESCE(pp.last_name,'') as full_name, p.avatar_url
      FROM psychologist_time_slots pts
      JOIN psychologist_profiles pp ON pp.id = pts.psychologist_id
      LEFT JOIN profiles p ON p.user_id = pp.user_id
      WHERE pts.status='available' AND pts.publish_to_hamravan=true AND pts.start_datetime > NOW()
        AND pp.verification_status IN ('approved','active') AND pp.public_profile_status='visible'
    `;
        const params = [];
        if (psychologistUserId) {
            params.push(psychologistUserId);
            query += ` AND pp.user_id = $${params.length}`;
        }
        if (city) {
            params.push(city);
            query += ` AND pp.city = $${params.length}`;
        }
        query += ' ORDER BY pts.start_datetime ASC LIMIT 100';
        return this.ds.query(query, params);
    }
    async bookSlot(userId, slotId, userNeed, notes) {
        const slots = await this.ds.query(`
      SELECT pts.*, pp.session_price, pp.user_id as psych_user_id
      FROM psychologist_time_slots pts JOIN psychologist_profiles pp ON pp.id = pts.psychologist_id
      WHERE pts.id = $1 AND pts.status = 'available'
    `, [slotId]);
        if (!slots.length)
            throw new common_1.BadRequestException('این اسلات در دسترس نیست یا قبلاً رزرو شده است');
        const slot = slots[0];
        const updated = await this.ds.query(`
      UPDATE psychologist_time_slots SET status='reserved', booked_by=$1, booked_at=NOW()
      WHERE id=$2 AND status='available' RETURNING id
    `, [userId, slotId]);
        if (!updated.length)
            throw new common_1.BadRequestException('رزرو انجام نشد، لطفاً دوباره امتحان کنید');
        const [booking] = await this.ds.query(`
      INSERT INTO psychologist_bookings (user_id, psychologist_id, slot_id, status, user_need_summary, user_notes, amount)
      VALUES ($1,$2,$3,'confirmed',$4,$5,$6) RETURNING id
    `, [userId, slot.psychologist_id, slotId, userNeed || '', notes || '', slot.session_price || 0]);
        return { success: true, booking_id: booking.id, slot_id: slotId, start: slot.start_datetime,
            end: slot.end_datetime, session_type: slot.session_type, message: 'رزرو با موفقیت انجام شد' };
    }
    async getDashboardStats(userId) {
        const profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile)
            return null;
        const [stats] = await this.ds.query(`
      SELECT
        COUNT(*) FILTER (WHERE pb.status='pending_payment') as pending,
        COUNT(*) FILTER (WHERE pb.status='confirmed') as confirmed,
        COUNT(*) FILTER (WHERE pb.status='completed') as completed,
        COUNT(DISTINCT pb.user_id) as total_patients,
        COUNT(pts.id) FILTER (WHERE pts.status='available' AND pts.start_datetime > NOW()) as available_slots
      FROM psychologist_profiles pp
      LEFT JOIN psychologist_bookings pb ON pb.psychologist_id = pp.id
      LEFT JOIN psychologist_time_slots pts ON pts.psychologist_id = pp.id
      WHERE pp.user_id = $1
    `, [userId]);
        const recentBookings = await this.ds.query(`
      SELECT pb.*, pts.start_datetime, pts.end_datetime, pts.session_type, u.name as patient_name
      FROM psychologist_bookings pb
      JOIN psychologist_time_slots pts ON pts.id = pb.slot_id
      JOIN users u ON u.id = pb.user_id
      JOIN psychologist_profiles pp ON pp.id = pb.psychologist_id
      WHERE pp.user_id=$1 ORDER BY pb.created_at DESC LIMIT 10
    `, [userId]);
        const upcomingSlots = await this.ds.query(`
      SELECT pts.* FROM psychologist_time_slots pts
      JOIN psychologist_profiles pp ON pp.id = pts.psychologist_id
      WHERE pp.user_id=$1 AND pts.start_datetime > NOW() ORDER BY pts.start_datetime ASC LIMIT 20
    `, [userId]);
        return { profile, stats, recentBookings, upcomingSlots };
    }
    async getMySlots(userId, from, to) {
        let q = `
      SELECT pts.*, CASE WHEN pts.booked_by IS NOT NULL THEN u.name ELSE NULL END as booked_by_name
      FROM psychologist_time_slots pts
      JOIN psychologist_profiles pp ON pp.id = pts.psychologist_id
      LEFT JOIN users u ON u.id = pts.booked_by
      WHERE pp.user_id = $1
    `;
        const params = [userId];
        if (from) {
            params.push(from);
            q += ` AND pts.start_datetime >= $${params.length}`;
        }
        if (to) {
            params.push(to);
            q += ` AND pts.start_datetime <= $${params.length}`;
        }
        q += ' ORDER BY pts.start_datetime ASC';
        return this.ds.query(q, params);
    }
    async getMyBookings(userId) {
        return this.ds.query(`
      SELECT pb.*, pts.start_datetime, pts.end_datetime, pts.session_type, pts.location_description, u.name as patient_name
      FROM psychologist_bookings pb
      JOIN psychologist_time_slots pts ON pts.id = pb.slot_id
      JOIN users u ON u.id = pb.user_id
      JOIN psychologist_profiles pp ON pp.id = pb.psychologist_id
      WHERE pp.user_id=$1 ORDER BY pts.start_datetime DESC
    `, [userId]);
    }
    async getMyBookingById(userId, bookingId) {
        const rows = await this.ds.query(`
      SELECT pb.*, pts.start_datetime, pts.end_datetime, pts.session_type, u.name as patient_name
      FROM psychologist_bookings pb
      JOIN psychologist_time_slots pts ON pts.id = pb.slot_id
      JOIN users u ON u.id = pb.user_id
      JOIN psychologist_profiles pp ON pp.id = pb.psychologist_id
      WHERE pp.user_id=$1 AND pb.id=$2
    `, [userId, bookingId]);
        if (!rows.length)
            throw new common_1.NotFoundException('رزرو یافت نشد');
        return rows[0];
    }
    async createInterview(psychUserId, data) {
        const [interview] = await this.ds.query(`
      INSERT INTO session_interviews (psychologist_user_id, patient_user_id, booking_id, session_mode, session_datetime)
      VALUES ($1,$2,$3,$4,$5) RETURNING id
    `, [psychUserId, data.patientUserId, data.bookingId || null, data.sessionMode || 'online', data.sessionDatetime || new Date().toISOString()]);
        return { interview_id: interview.id, message: 'فرم مصاحبه ایجاد شد' };
    }
    async saveInterviewSection(psychUserId, interviewId, section) {
        const rows = await this.ds.query(`SELECT id FROM session_interviews WHERE id=$1 AND psychologist_user_id=$2`, [interviewId, psychUserId]);
        if (!rows.length)
            throw new common_1.NotFoundException('فرم یافت نشد یا دسترسی ندارید');
        for (const item of section.items) {
            await this.ds.query(`
        INSERT INTO session_interview_items (interview_id, section_key, item_key, item_value, item_note)
        VALUES ($1,$2,$3,$4,$5)
      `, [interviewId, section.sectionKey, item.key, JSON.stringify(item.value), item.note || null]);
        }
        return { success: true, saved: section.items.length };
    }
    async submitInterview(psychUserId, interviewId, clinicalNote) {
        const rows = await this.ds.query(`SELECT id, patient_user_id FROM session_interviews WHERE id=$1 AND psychologist_user_id=$2`, [interviewId, psychUserId]);
        if (!rows.length)
            throw new common_1.NotFoundException('فرم یافت نشد');
        const items = await this.ds.query(`SELECT section_key, item_key, item_value, item_note FROM session_interview_items WHERE interview_id=$1`, [interviewId]);
        const riskItems = items.filter((i) => i.section_key === 'risk_assessment');
        let riskLevel = 'low';
        const riskFlags = [];
        for (const r of riskItems) {
            const v = typeof r.item_value === 'string' ? r.item_value : JSON.stringify(r.item_value);
            if (['suicidal_ideation', 'suicide_plan', 'self_harm', 'harm_to_others'].includes(r.item_key)) {
                if (v !== '"none"' && v !== 'false' && v !== '"no"' && v !== 'null') {
                    riskFlags.push(r.item_key);
                    if (['suicidal_ideation', 'suicide_plan'].includes(r.item_key))
                        riskLevel = 'high';
                    else if (riskLevel !== 'high')
                        riskLevel = 'moderate';
                }
            }
        }
        const presenting = items.find((i) => i.section_key === 'presenting_problem' && i.item_key === 'main_issue');
        const mood = items.find((i) => i.section_key === 'mse' && i.item_key === 'mood');
        const aiSummary = [
            presenting ? `مشکل اصلی: ${JSON.stringify(presenting.item_value)}` : '',
            mood ? `خلق: ${JSON.stringify(mood.item_value)}` : '',
            riskFlags.length ? `⚠️ Risk flags: ${riskFlags.join(', ')}` : '',
            clinicalNote ? `یادداشت بالینی: ${clinicalNote.substring(0, 200)}` : '',
        ].filter(Boolean).join(' | ');
        const complexity = riskLevel === 'high' ? 'high_risk' : riskFlags.length ? 'moderate_complexity' : 'standard';
        await this.ds.query(`
      UPDATE session_interviews SET clinical_note=$1, interview_status='submitted',
        risk_level=$2, ai_risk_flags=$3, ai_summary=$4, ai_complexity=$5, ai_topics=$6, submitted_at=NOW()
      WHERE id=$7
    `, [clinicalNote, riskLevel, JSON.stringify(riskFlags), aiSummary, complexity,
            JSON.stringify(riskFlags.map(f => f.replace(/_/g, ' '))), interviewId]);
        if (riskLevel === 'high') {
            const psychInfo = await this.ds.query(`SELECT name FROM users WHERE id=$1`, [psychUserId]);
            await this.notifyHighRisk(interviewId, psychInfo[0]?.name || 'روانشناس', riskFlags);
        }
        return {
            success: true, risk_level: riskLevel, risk_flags: riskFlags, complexity,
            needs_urgent_attention: riskLevel === 'high',
            message: riskLevel === 'high' ? '⚠️ این پرونده به دلیل ریسک بالا نیاز به توجه فوری دارد' : 'فرم مصاحبه با موفقیت ثبت شد',
        };
    }
    async notifyHighRisk(interviewId, psychName, riskFlags) {
        await this.ds.query(`
      INSERT INTO notifications (user_id, title, body, type, metadata)
      SELECT u.id, $1, $2, 'admin_alert', $3 FROM users u WHERE u.role = 'admin' LIMIT 5
    `, ['⚠️ هشدار پرونده پرخطر', `روانشناس ${psychName} یک پرونده با ریسک بالا ثبت کرد: ${riskFlags.join('، ')}`,
            JSON.stringify({ interview_id: interviewId, risk_flags: riskFlags })]).catch(() => { });
    }
    async getMyInterviews(psychUserId) {
        return this.ds.query(`
      SELECT si.*, u.name as patient_name FROM session_interviews si
      JOIN users u ON u.id = si.patient_user_id
      WHERE si.psychologist_user_id=$1 ORDER BY si.created_at DESC
    `, [psychUserId]);
    }
    async getMyProfile(userId) { return this.profileRepo.findOne({ where: { userId } }); }
    async updateMyProfile(userId, data) {
        let profile = await this.profileRepo.findOne({ where: { userId } });
        if (!profile)
            throw new common_1.BadRequestException('پروفایل یافت نشد');
        Object.assign(profile, data);
        return this.profileRepo.save(profile);
    }
    async getMyPatients(userId) {
        return this.ds.query(`
      SELECT DISTINCT ON (pb.user_id) pb.user_id, u.name as patient_name, pb.status as last_status, pb.created_at,
        pts.start_datetime, pts.session_type, COALESCE(tr.test_count,0) as test_count
      FROM psychologist_bookings pb
      JOIN psychologist_profiles pp ON pp.id = pb.psychologist_id
      JOIN users u ON u.id = pb.user_id
      JOIN psychologist_time_slots pts ON pts.id = pb.slot_id
      LEFT JOIN (SELECT user_id, COUNT(*) as test_count FROM test_results GROUP BY user_id) tr ON tr.user_id = pb.user_id
      WHERE pp.user_id=$1 ORDER BY pb.user_id, pb.created_at DESC
    `, [userId]);
    }
    async getPatientTests(therapistUserId, patientUserId) {
        const booking = await this.ds.query(`
      SELECT pb.id FROM psychologist_bookings pb JOIN psychologist_profiles pp ON pp.id = pb.psychologist_id
      WHERE pp.user_id=$1 AND pb.user_id=$2 LIMIT 1
    `, [therapistUserId, patientUserId]);
        if (!booking.length)
            throw new common_1.BadRequestException('دسترسی مجاز نیست');
        return this.ds.query(`SELECT test_name, test_id, main_result, scores, completed_at FROM test_results WHERE user_id=$1 ORDER BY completed_at DESC`, [patientUserId]);
    }
    async updateSessionNotes(therapistUserId, bookingId, notes) {
        const b = await this.ds.query(`
      SELECT pb.id FROM psychologist_bookings pb JOIN psychologist_profiles pp ON pp.id = pb.psychologist_id
      WHERE pp.user_id=$1 AND pb.id=$2
    `, [therapistUserId, bookingId]);
        if (!b.length)
            throw new common_1.BadRequestException('دسترسی مجاز نیست');
        await this.ds.query(`UPDATE psychologist_bookings SET status=COALESCE($1,status), updated_at=NOW() WHERE id=$2`, [notes.status, bookingId]);
        return { success: true };
    }
    async updateBookingStatus(therapistUserId, bookingId, status) {
        await this.ds.query(`
      UPDATE psychologist_bookings pb SET status=$1 FROM psychologist_profiles pp
      WHERE pp.id = pb.psychologist_id AND pp.user_id=$2 AND pb.id=$3
    `, [status, therapistUserId, bookingId]);
        return { success: true };
    }
    // ── Admin ────────────────────────────────────────────────────
    async getPendingForAdmin() {
        return this.ds.query(`
      SELECT pp.*, u.name, u."mobileNumber",
        (SELECT SUM(score) FROM professional_verification_checks WHERE psychologist_profile_id = pp.id) as score_summary
      FROM psychologist_profiles pp JOIN users u ON u.id = pp.user_id
      WHERE pp.verification_status IN ('pending_admin','needs_admin_review')
      ORDER BY pp.created_at DESC
    `);
    }
    async approveByAdmin(licenseNumber, adminId, adminNote) {
        const p = await this.profileRepo.findOne({ where: { licenseNumber } });
        if (!p)
            throw new common_1.BadRequestException('پروفایل یافت نشد');
        p.verificationStatus = 'approved';
        p.adminNote = adminNote || '';
        p.verifiedAt = new Date();
        p.professional_status = 'active';
        p.public_profile_status = 'visible';
        await this.profileRepo.save(p);
        await this.logAdminAction(adminId, 'psychologist', licenseNumber, 'approve', adminNote);
        return p;
    }
    async rejectByAdmin(licenseNumber, adminId, reason) {
        const p = await this.profileRepo.findOne({ where: { licenseNumber } });
        if (!p)
            throw new common_1.BadRequestException('پروفایل یافت نشد');
        p.verificationStatus = 'rejected';
        p.rejected_reason = reason;
        p.professional_status = 'rejected';
        await this.profileRepo.save(p);
        await this.logAdminAction(adminId, 'psychologist', licenseNumber, 'reject', reason);
        return p;
    }
    async requestRevision(licenseNumber, adminId, reason) {
        const p = await this.profileRepo.findOne({ where: { licenseNumber } });
        if (!p)
            throw new common_1.BadRequestException('پروفایل یافت نشد');
        p.verificationStatus = 'needs_revision';
        p.rejected_reason = reason;
        p.professional_status = 'needs_revision';
        p.public_profile_status = 'hidden';
        await this.profileRepo.save(p);
        await this.logAdminAction(adminId, 'psychologist', licenseNumber, 'request_revision', reason);
        return p;
    }
    // ── آپلود تصاویر فضا برای Venue ──────────────────────────────
    async saveVenueImages(userId, venueId, files) {
        const owns = await this.ds.query(`SELECT id FROM venues WHERE id=$1 AND owner_user_id=$2`, [venueId, userId]);
        if (!owns.length)
            throw new common_1.BadRequestException('شما مالک این مکان نیستید یا مکان یافت نشد');
        const urls = files.map((f) => `/uploads/venues/${f.filename}`);
        await this.ds.query(`
      UPDATE venues
      SET images = COALESCE(images, '[]'::jsonb) || $1::jsonb
      WHERE id = $2
    `, [JSON.stringify(urls), venueId]);
        return { success: true, urls, message: `${urls.length} تصویر با موفقیت بارگذاری شد` };
    }
    // ── Blacklist مدیریت (ادمین) ────────────────────────────────
    async addToBlacklist(adminId, mobile, reason) {
        await this.ds.query(`
      INSERT INTO professional_blacklist (mobile_number, reason)
      VALUES ($1, $2)
      ON CONFLICT (mobile_number) DO UPDATE SET reason = EXCLUDED.reason
    `, [mobile, reason || null]);
        await this.logAdminAction(adminId, 'mobile', mobile, 'blacklist_add', reason);
        return { success: true, message: 'شماره به لیست سیاه اضافه شد' };
    }
    async removeFromBlacklist(adminId, mobile) {
        await this.ds.query(`DELETE FROM professional_blacklist WHERE mobile_number=$1`, [mobile]);
        await this.logAdminAction(adminId, 'mobile', mobile, 'blacklist_remove');
        return { success: true, message: 'شماره از لیست سیاه حذف شد' };
    }
    async getBlacklist() {
        return this.ds.query(`SELECT * FROM professional_blacklist ORDER BY created_at DESC`);
    }
    // ── Audit Log مشاهده (ادمین) ─────────────────────────────────
    async getAuditLogs(targetType, targetId, limit = 100) {
        let q = `SELECT aal.*, u.name as admin_name FROM admin_action_logs aal
              LEFT JOIN users u ON u.id = aal.admin_id WHERE 1=1`;
        const params = [];
        if (targetType) {
            params.push(targetType);
            q += ` AND aal.target_type = $${params.length}`;
        }
        if (targetId) {
            params.push(targetId);
            q += ` AND aal.target_id = $${params.length}`;
        }
        params.push(limit);
        q += ` ORDER BY aal.created_at DESC LIMIT $${params.length}`;
        return this.ds.query(q, params);
    }
};
exports.PsychologistVerifyService = PsychologistVerifyService;
exports.PsychologistVerifyService = PsychologistVerifyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(psychologist_profile_entity_1.PsychologistProfile)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], PsychologistVerifyService);
