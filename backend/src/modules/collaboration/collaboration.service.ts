import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { mutationRows } from '../../common/database/query-result';

@Injectable()
export class CollaborationService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  async registerFacilitator(userId: string, data: any, resumeUrl: string | null) {
    const { name, phone, city, workField, workArea, availableTimes, bio } = data;
    if (!name?.trim() || !city?.trim() || !/^09\d{9}$/.test(String(phone || '').replace(/\D/g, ''))) {
      throw new BadRequestException('نام، شهر و شماره موبایل معتبر الزامی است');
    }
    const normalizedPhone = String(phone).replace(/\D/g, '');
    const [account] = await this.ds.query(
      `SELECT phone_number FROM users WHERE id=$1`, [userId],
    );
    if (!account || account.phone_number !== normalizedPhone) {
      throw new BadRequestException('شماره تماس باید با شماره حساب کاربری یکسان باشد');
    }
    const nameParts = String(name).trim().split(/\s+/);
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ') || '-';
    const experience = [workField, workArea, availableTimes].filter(Boolean).join(' | ');

    // چک تکراری
    const existing = await this.ds.query(
      'SELECT id FROM facilitator_profiles WHERE user_id=$1', [userId]
    );
    if (existing?.length) {
      await this.ds.query(`
        UPDATE facilitator_profiles SET
          first_name=$1, last_name=$2, city=$3, domains=$4,
          event_experience=$5, bio=$6,
          portfolio_url=COALESCE($7,portfolio_url), status='pending_review',
          submitted_at=NOW(), updated_at=NOW()
        WHERE user_id=$8
      `, [firstName, lastName, city, JSON.stringify(workField ? [workField] : []),
          experience, bio || '', resumeUrl, userId]);
      return { success: true, message: 'پروفایل بروزرسانی شد', updated: true };
    }

    // ثبت جدید
    const res = await this.ds.query(`
      INSERT INTO facilitator_profiles
        (user_id, first_name, last_name, city, domains, event_experience,
         bio, portfolio_url, status, submitted_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending_review',NOW())
      RETURNING id
    `, [userId, firstName, lastName, city, JSON.stringify(workField ? [workField] : []),
        experience, bio || '', resumeUrl]);

    return { success: true, message: 'درخواست تسهیلگری ثبت شد. منتظر تأیید باشید.', id: res[0]?.id };
  }

  async getMyFacilitatorProfile(userId: string) {
    const rows = await this.ds.query(
      'SELECT * FROM facilitator_profiles WHERE user_id=$1 LIMIT 1', [userId]
    );
    return rows?.[0] || null;
  }

  async updateFacilitatorProfile(userId: string, data: any) {
    const allowed = ['city', 'bio', 'domains', 'event_experience', 'portfolio_url', 'sample_events'];
    const sets = Object.entries(data)
      .filter(([k]) => allowed.includes(k))
      .map(([k], i) => `${k}=$${i + 2}`)
      .join(', ');
    const vals = Object.entries(data)
      .filter(([k]) => allowed.includes(k))
      .map(([, v]) => typeof v === 'object' ? JSON.stringify(v) : v);

    if (!sets) return { success: false };
    await this.ds.query(
      `UPDATE facilitator_profiles SET ${sets}, updated_at=NOW() WHERE user_id=$1`,
      [userId, ...vals]
    );
    return { success: true };
  }

  async getAllFacilitators() {
    return this.ds.query(
      `SELECT fp.*,u.name,u.phone_number AS "mobileNumber"
       FROM facilitator_profiles fp JOIN users u ON u.id=fp.user_id
       ORDER BY fp.created_at DESC`
    );
  }

  async approveFacilitator(id: string, note?: string) {
    await this.ds.transaction(async (manager) => {
      const rows = mutationRows<{ user_id: string }>(await manager.query(
        `UPDATE facilitator_profiles SET status='approved', admin_note=$1,
          verified_at=NOW(), rejection_reason=NULL, updated_at=NOW()
         WHERE id=$2 RETURNING user_id`,
        [note || null, id],
      ));
      if (!rows.length) throw new NotFoundException('پروفایل تسهیلگر یافت نشد');
      await manager.query(`UPDATE users SET role='facilitator', updated_at=NOW() WHERE id=$1`, [rows[0].user_id]);
    });
    return { success: true };
  }

  async rejectFacilitator(id: string, note: string) {
    const rows = mutationRows(await this.ds.query(
      `UPDATE facilitator_profiles SET status='rejected', admin_note=$1,
       rejection_reason=$1, rejected_at=NOW(), updated_at=NOW() WHERE id=$2 RETURNING id`,
      [note, id]
    ));
    if (!rows.length) throw new NotFoundException('پروفایل تسهیلگر یافت نشد');
    return { success: true };
  }
}
