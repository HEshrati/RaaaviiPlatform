import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { mutationRows } from '../../common/database/query-result';

const VENUE_TYPES = ['کافه', 'فضای اشتراکی', 'سالن همایش', 'باغ و فضای باز', 'خانه فرهنگ', 'سایر'];
const AMENITIES_OPTIONS = ['Wi-Fi', 'پروژکتور', 'صوت و تصویر', 'پارکینگ', 'آشپزخانه', 'سرویس بهداشتی', 'تهویه مطبوع'];

@Injectable()
export class VenueService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  getOptions() { return { venue_types: VENUE_TYPES, amenities: AMENITIES_OPTIONS }; }

  private normalizeRegistration(data: any) {
    const managerName = String(data.managerName || '').trim();
    const venueName = String(data.venueName || '').trim();
    const venueType = String(data.venueType || '').trim();
    const address = String(data.address || '').trim();
    const city = String(data.city || '').trim();
    const capacity = Number(data.capacity);

    if (![managerName, venueName, venueType, address, city].every(Boolean)) {
      throw new BadRequestException('نام مسئول، نام فضا، نوع، آدرس و شهر الزامی است');
    }
    if (!VENUE_TYPES.includes(venueType)) {
      throw new BadRequestException('نوع فضای انتخاب‌شده معتبر نیست');
    }
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 5000) {
      throw new BadRequestException('ظرفیت باید عددی بین ۱ تا ۵۰۰۰ باشد');
    }

    const amenities = Array.isArray(data.amenities)
      ? data.amenities.filter((item: unknown) => typeof item === 'string' && AMENITIES_OPTIONS.includes(item))
      : [];

    return { managerName, venueName, venueType, address, city, capacity, amenities };
  }

  async registerVenue(userId: string, data: {
    managerName: string; venueName: string; venueType: string;
    address: string; city: string; capacity: number;
    amenities?: string[]; workingHours?: any; images?: string[];
    lat?: number; lng?: number;
  }) {
    const normalized = this.normalizeRegistration(data);
    const existing = await this.ds.query(`SELECT id FROM venue_profiles WHERE user_id=$1`, [userId]);
    if (existing.length) {
      await this.ds.query(`
        UPDATE venue_profiles SET
          manager_name=$1, venue_name=$2, venue_type=$3, address=$4, city=$5,
          capacity=$6, amenities=$7, working_hours=$8, images=$9, lat=$10, lng=$11,
          status='profile_incomplete', updated_at=NOW()
        WHERE user_id=$12
      `, [normalized.managerName, normalized.venueName, normalized.venueType, normalized.address, normalized.city,
          normalized.capacity, JSON.stringify(normalized.amenities), JSON.stringify(data.workingHours||{}),
          JSON.stringify(data.images||[]), data.lat||null, data.lng||null, userId]);
      return { success: true, message: 'اطلاعات فضا به‌روز شد' };
    }

    await this.ds.query(`
      INSERT INTO venue_profiles
        (user_id, manager_name, venue_name, venue_type, address, city,
         capacity, amenities, working_hours, images, lat, lng)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [userId, normalized.managerName, normalized.venueName, normalized.venueType, normalized.address, normalized.city,
        normalized.capacity, JSON.stringify(normalized.amenities), JSON.stringify(data.workingHours||{}),
        JSON.stringify(data.images||[]), data.lat||null, data.lng||null]);

    return { success: true, message: 'فضا ثبت شد. لطفاً شرایط همکاری را بپذیرید' };
  }

  async acceptTerms(userId: string) {
    const rows = await this.ds.query(`SELECT id FROM venue_profiles WHERE user_id=$1`, [userId]);
    if (!rows.length) throw new BadRequestException('ابتدا اطلاعات فضا را ثبت کنید');
    await this.ds.query(`
      UPDATE venue_profiles SET
        accepted_terms=true, status='pending_review', submitted_at=NOW(), updated_at=NOW()
      WHERE user_id=$1
    `, [userId]);
    return { success: true, message: 'شرایط پذیرفته شد. پروفایل در انتظار بررسی است' };
  }

  async getMyProfile(userId: string) {
    const rows = await this.ds.query(`SELECT * FROM venue_profiles WHERE user_id=$1`, [userId]);
    return rows[0] || null;
  }

  async updateMyProfile(userId: string, data: any) {
    const rows = await this.ds.query(`SELECT id FROM venue_profiles WHERE user_id=$1`, [userId]);
    if (!rows.length) throw new NotFoundException('پروفایل یافت نشد');
    const allowed = ['manager_name','venue_name','venue_type','address','city','capacity','amenities','working_hours','images','lat','lng'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (!fields.length) return { success: true };
    const sets = fields.map((k,i) => `${k}=$${i+2}`).join(',');
    await this.ds.query(
      `UPDATE venue_profiles SET ${sets},
        status = CASE WHEN status IN ('rejected','needs_revision') THEN 'profile_incomplete' ELSE status END,
        accepted_terms = CASE WHEN status IN ('rejected','needs_revision') THEN false ELSE accepted_terms END,
        updated_at=NOW() WHERE user_id=$1`,
      [userId, ...fields.map(k => typeof data[k]==='object' ? JSON.stringify(data[k]) : data[k])]
    );
    return { success: true };
  }

  async getStatus(userId: string) {
    const rows = await this.ds.query(
      `SELECT status,venue_name,admin_note,rejection_reason FROM venue_profiles WHERE user_id=$1`,
      [userId],
    );
    if (!rows.length) return { status: 'not_started' };

    // در داشبورد همکاران، کارت «کل شرکت‌کنندگان» از این endpoint خوانده می‌شود.
    // پیش از این فقط status برمی‌گشت و آن کارت همیشه صفر بود، حتی با رویداد و رزرو واقعی.
    const [stats] = await this.ds.query(`
      SELECT
        COUNT(DISTINCT e.id)::int AS total_events,
        COUNT(DISTINCT e.id) FILTER (WHERE e.start_date > NOW())::int AS upcoming_events,
        COUNT(DISTINCT e.id) FILTER (WHERE e.end_date < NOW())::int AS completed_events,
        COUNT(b.id) FILTER (WHERE b.status = 'confirmed')::int AS total_participants
      FROM events e
      LEFT JOIN bookings b ON b.event_id = e.id
      WHERE e.location = $1 AND e.is_active = true
    `, [rows[0].venue_name]);

    return {
      status: rows[0].status,
      total_events: stats?.total_events || 0,
      upcoming_events: stats?.upcoming_events || 0,
      completed_events: stats?.completed_events || 0,
      total_participants: stats?.total_participants || 0,
      rejection_reason: rows[0].status === 'rejected' ? (rows[0].rejection_reason || rows[0].admin_note) : null,
      needs_revision_reason: rows[0].status === 'needs_revision' ? rows[0].admin_note : null,
    };
  }

    // پنل میزبانی: فقط رویدادهای همان فضا. رویدادهای گذشته نیز باید برگردند
    // تا کارت «برگزارش‌شده» در داشبورد با دادهٔ واقعی پر شود.
  async getVenueEvents(userId: string) {
    const venue = await this.ds.query(`SELECT venue_name FROM venue_profiles WHERE user_id=$1`, [userId]);
    if (!venue.length) throw new NotFoundException('پروفایل یافت نشد');
    return this.ds.query(`
      SELECT e.id, e.title, e.start_date, e.end_date, e.current_bookings, e.capacity, e.city
      FROM events e
      WHERE e.location = $1 AND e.is_active = true
      ORDER BY e.start_date DESC LIMIT 20
    `, [venue[0].venue_name]);
  }

  // Admin
  async getAllForAdmin(status?: string) {
    let q = `SELECT vp.*, u.name, u.phone_number AS "mobileNumber" FROM venue_profiles vp JOIN users u ON u.id=vp.user_id`;
    const params: any[] = [];
    if (status) { params.push(status); q += ` WHERE vp.status=$1`; }
    q += ' ORDER BY vp.created_at DESC';
    return this.ds.query(q, params);
  }

  async approveByAdmin(id: string, note?: string) {
    await this.ds.transaction(async (manager) => {
      const rows = mutationRows<{ user_id: string }>(await manager.query(
        `UPDATE venue_profiles SET status='approved', admin_note=$1, verified_at=NOW(),
          rejection_reason=NULL, updated_at=NOW() WHERE id=$2 RETURNING user_id`,
        [note||'', id],
      ));
      if (!rows.length) throw new NotFoundException('پروفایل فضا یافت نشد');
      await manager.query(
        `UPDATE users SET role=CASE WHEN role='user' THEN 'partner' ELSE role END WHERE id=$1`,
        [rows[0].user_id],
      );
    });
    return { success: true };
  }

  async rejectByAdmin(id: string, reason: string) {
    const rows = mutationRows(await this.ds.query(
      `UPDATE venue_profiles SET status='rejected', rejection_reason=$1, admin_note=$1,
        rejected_at=NOW(), updated_at=NOW() WHERE id=$2 RETURNING id`,
      [reason, id],
    ));
    if (!rows.length) throw new NotFoundException('پروفایل فضا یافت نشد');
    return { success: true };
  }

  async requestRevisionByAdmin(id: string, reason: string) {
    const rows = mutationRows(await this.ds.query(
      `UPDATE venue_profiles SET status='needs_revision', admin_note=$1, rejection_reason=NULL,
        updated_at=NOW() WHERE id=$2 RETURNING id`,
      [reason, id],
    ));
    if (!rows.length) throw new NotFoundException('پروفایل فضا یافت نشد');
    return { success: true };
  }
}
