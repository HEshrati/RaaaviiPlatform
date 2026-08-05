import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { mutationRows } from '../../common/database/query-result';

const FACILITATOR_DOMAINS = [
  'هنر و خلاقیت', 'فناوری و نوآوری', 'توسعه فردی', 'کتاب و ادبیات',
  'بازی و سرگرمی', 'موسیقی', 'طبیعت‌گردی', 'آشپزی', 'ورزش', 'سینما',
];

@Injectable()
export class FacilitatorService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  getDomains() { return { domains: FACILITATOR_DOMAINS }; }

  async registerProfile(userId: string, data: {
    firstName: string; lastName: string; nationalId: string; city: string;
    bio?: string; domains: string[]; eventExperience?: string;
    portfolioUrl?: string; sampleEvents?: any[];
  }) {
    const existing = await this.ds.query(
      `SELECT id FROM facilitator_profiles WHERE user_id = $1`, [userId]
    );

    if (existing.length) {
      await this.ds.query(`
        UPDATE facilitator_profiles SET
          first_name=$1, last_name=$2, national_id=$3, city=$4, bio=$5,
          domains=$6, event_experience=$7, portfolio_url=$8, sample_events=$9,
          status='profile_incomplete', updated_at=NOW()
        WHERE user_id=$10
      `, [data.firstName, data.lastName, data.nationalId, data.city, data.bio||'',
          JSON.stringify(data.domains), data.eventExperience||'',
          data.portfolioUrl||'', JSON.stringify(data.sampleEvents||[]), userId]);
      return { success: true, message: 'پروفایل به‌روز شد' };
    }

    await this.ds.query(`
      INSERT INTO facilitator_profiles
        (user_id, first_name, last_name, national_id, city, bio,
         domains, event_experience, portfolio_url, sample_events, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'profile_incomplete')
    `, [userId, data.firstName, data.lastName, data.nationalId, data.city, data.bio||'',
        JSON.stringify(data.domains), data.eventExperience||'',
        data.portfolioUrl||'', JSON.stringify(data.sampleEvents||[])]);

    return { success: true, message: 'پروفایل ثبت شد. لطفاً مرامنامه را بپذیرید' };
  }

  async acceptManifesto(userId: string) {
    const rows = await this.ds.query(
      `SELECT id, status FROM facilitator_profiles WHERE user_id = $1`, [userId]
    );
    if (!rows.length) throw new BadRequestException('ابتدا پروفایل را تکمیل کنید');

    await this.ds.query(`
      UPDATE facilitator_profiles SET
        accepted_manifesto=true, accepted_manifesto_at=NOW(),
        status='pending_review', submitted_at=NOW(), updated_at=NOW()
      WHERE user_id=$1
    `, [userId]);

    return { success: true, message: 'مرامنامه پذیرفته شد. پروفایل در انتظار بررسی است' };
  }

  async getMyProfile(userId: string) {
    const rows = await this.ds.query(
      `SELECT * FROM facilitator_profiles WHERE user_id = $1`, [userId]
    );
    const profile = rows[0];
    if (!profile) return null;

    profile.checklist_done = {
      personal_info: !!(profile.first_name && profile.last_name && profile.national_id && profile.city),
      resume:        !!profile.resume_received,
      interview:     !!profile.interview_done,
      training:      !!profile.training_done,
      agreement:     !!profile.accepted_manifesto,
      schedule:      !!profile.schedule_set,
    };
    return profile;
  }

  async updateMyProfile(userId: string, data: any) {
    const rows = await this.ds.query(
      `SELECT id FROM facilitator_profiles WHERE user_id = $1`, [userId]
    );
    if (!rows.length) throw new NotFoundException('پروفایل یافت نشد');
    const fields = Object.keys(data)
      .filter(k => ['bio','city','domains','event_experience','portfolio_url','sample_events'].includes(k));
    if (!fields.length) return { success: true };
    const sets = fields.map((k,i) => `${k}=$${i+2}`).join(',');
    await this.ds.query(
      `UPDATE facilitator_profiles SET ${sets}, updated_at=NOW() WHERE user_id=$1`,
      [userId, ...fields.map(k => typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k])]
    );
    return { success: true };
  }

  async getStatus(userId: string) {
    const rows = await this.ds.query(
      // ستون واقعی schema برای دلیل رد rejection_reason است.
      // در نتیجه فرانت‌اند هیچ‌وقت دلیل رد یا نیاز به اصلاح را نمایش نمی‌داد.
      `SELECT status, accepted_manifesto, submitted_at, admin_note, rejection_reason FROM facilitator_profiles WHERE user_id=$1`, [userId]
    );
    if (!rows.length) return { status: 'not_started', manifestoAccepted: false };

    const { status, accepted_manifesto, admin_note, rejection_reason } = rows[0];
    const messages: Record<string,string> = {
      profile_incomplete: accepted_manifesto ? 'پروفایل ناقص است' : 'لطفاً مرامنامه را بپذیرید',
      pending_review:     'پروفایل در انتظار بررسی است',
      approved:           'پروفایل تایید شده ✅',
      rejected:           'پروفایل رد شده است',
      needs_revision:     'نیاز به اصلاح دارد',
    };

    const eventStats = await this.ds.query(`
      SELECT
        COUNT(*)::int AS total_events,
        COUNT(*) FILTER (WHERE e.end_date < NOW())::int AS completed_events
      FROM event_hosts eh
      JOIN events e ON e.id = eh.event_id
      WHERE eh.host_id = $1
    `, [userId]);

    const participantStats = await this.ds.query(`
      SELECT COUNT(*)::int AS total_participants
      FROM bookings b
      WHERE b.status = 'confirmed'
        AND b.event_id IN (SELECT event_id FROM event_hosts WHERE host_id = $1)
    `, [userId]);

    const ratingStats = await this.ds.query(`
      SELECT ROUND(AVG(overall_rating)::numeric, 1) AS rating
      FROM event_feedbacks
      WHERE event_id IN (SELECT event_id FROM event_hosts WHERE host_id = $1)
    `, [userId]);

    return {
      status,
      manifestoAccepted: !!accepted_manifesto,
      message: messages[status] || '',
      total_events: eventStats[0]?.total_events || 0,
      completed_events: eventStats[0]?.completed_events || 0,
      total_participants: participantStats[0]?.total_participants || 0,
      rating: ratingStats[0]?.rating ? Number(ratingStats[0].rating) : null,
      rejection_reason: status === 'rejected' ? (rejection_reason || admin_note || null) : null,
      needs_revision_reason: status === 'needs_revision' ? (admin_note || null) : null,
    };
  }

  async getMyEvents(userId: string) {
    return this.ds.query(`
      SELECT e.id, e.title, e.start_date as date, e.location, e.capacity,
             e.current_bookings as current_participants,
             e.approval_status, e.review_note, e.is_active,
             CASE
               WHEN e.approval_status <> 'approved' THEN e.approval_status
               WHEN e.end_date < NOW() THEN 'completed'
               ELSE 'upcoming'
             END AS status,
             eh.role AS host_role
      FROM event_hosts eh JOIN events e ON e.id = eh.event_id
      WHERE eh.host_id = $1
      ORDER BY e.start_date DESC
    `, [userId]);
  }

  // ── Admin ──
  async getAllForAdmin(status?: string) {
    let q = `SELECT fp.*, u.name, u.phone_number AS "mobileNumber" FROM facilitator_profiles fp JOIN users u ON u.id=fp.user_id`;
    const params: any[] = [];
    if (status) { params.push(status); q += ` WHERE fp.status=$1`; }
    q += ' ORDER BY fp.created_at DESC';
    return this.ds.query(q, params);
  }

  async approveByAdmin(id: string, note?: string) {
    await this.ds.transaction(async (manager) => {
      const rows = mutationRows<{ user_id: string }>(await manager.query(
        `UPDATE facilitator_profiles SET status='approved', admin_note=$1, verified_at=NOW(),
          rejection_reason=NULL, updated_at=NOW() WHERE id=$2 RETURNING user_id`,
        [note||'', id],
      ));
      if (!rows.length) throw new NotFoundException('پروفایل تسهیلگر یافت نشد');
      await manager.query(`UPDATE users SET role='facilitator' WHERE id=$1`, [rows[0].user_id]);
    });
    return { success: true };
  }

  async rejectByAdmin(id: string, reason: string) {
    const rows = mutationRows(await this.ds.query(
      `UPDATE facilitator_profiles SET status='rejected', rejection_reason=$1, admin_note=$1,
        rejected_at=NOW(), updated_at=NOW() WHERE id=$2 RETURNING id`,
      [reason, id],
    ));
    if (!rows.length) throw new NotFoundException('پروفایل تسهیلگر یافت نشد');
    return { success: true };
  }

  // ویژگی جدید: مشابه پنل روانشناس، امکان درخواست اصلاح پروفایل تسهیلگر پیش از این
  // برای ادمین وجود نداشت (فقط approve/reject بود)؛ در حالی‌که وضعیت 'needs_revision'
  // در پیام‌های getStatus و در UI پنل تسهیلگر از قبل تعریف شده بود اما هیچ مسیری برای
  // رسیدن به آن وضعیت وجود نداشت.
  async requestRevision(id: string, reason: string) {
    const rows = mutationRows(await this.ds.query(
      `UPDATE facilitator_profiles SET status='needs_revision', admin_note=$1, updated_at=NOW() WHERE id=$2 RETURNING id`,
      [reason, id],
    ));
    if (!rows.length) throw new NotFoundException('پروفایل تسهیلگر یافت نشد');
    return { success: true };
  }

  async updateChecklist(id: string, data: { resume_received?: boolean; interview_done?: boolean; training_done?: boolean; schedule_set?: boolean }) {
    const fields = Object.keys(data).filter(k => ['resume_received','interview_done','training_done','schedule_set'].includes(k));
    if (!fields.length) return { success: true };
    const sets = fields.map((k,i) => `${k}=$${i+2}`).join(',');
    await this.ds.query(
      `UPDATE facilitator_profiles SET ${sets}, updated_at=NOW() WHERE id=$1`,
      [id, ...fields.map(k => (data as any)[k])]
    );
    return { success: true };
  }
}
