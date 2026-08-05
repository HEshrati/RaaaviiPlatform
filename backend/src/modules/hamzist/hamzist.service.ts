import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SupportGroup } from '../my-therapist/entities/support-group.entity';
import { GroupMembership } from './entities/group-membership.entity';
import { GroupSession } from './entities/group-session.entity';
import { GroupSessionAttendance } from './entities/group-session-attendance.entity';
import { PaymentService } from '../payment/payment.service';
import { WalletService } from '../wallet/wallet.service';
import { mutationRows } from '../../common/database/query-result';

@Injectable()
export class HamzisteService {
  constructor(
    private paymentService: PaymentService,
    private walletService: WalletService,
    @InjectRepository(SupportGroup)
    private readonly groupRepo: Repository<SupportGroup>,
    @InjectRepository(GroupMembership)
    private readonly membershipRepo: Repository<GroupMembership>,
    @InjectRepository(GroupSession)
    private readonly sessionRepo: Repository<GroupSession>,
    @InjectRepository(GroupSessionAttendance)
    private readonly attendanceRepo: Repository<GroupSessionAttendance>,
    private readonly dataSource: DataSource,
  ) {}

  // ── لیست گروه‌های فعال (عمومی) ────────────────────────────────
  async listActiveGroups(filters?: { topic?: string; city?: string; mode?: string }) {
    const qb = this.groupRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.facilitator', 'facilitator')
      .where('g.status = :status', { status: 'active' });

    if (filters?.topic) {
      qb.andWhere('g.topic ILIKE :topic', { topic: `%${filters.topic}%` });
    }
    if (filters?.city) {
      qb.andWhere('g.city = :city', { city: filters.city });
    }
    if (filters?.mode) {
      qb.andWhere('g.mode = :mode', { mode: filters.mode });
    }

    const groups = await qb.orderBy('g.created_at', 'DESC').getMany();

    // ظرفیت باقی‌مانده برای هر گروه
    return groups.map((g) => ({
      ...g,
      available_spots: Math.max(0, g.capacity - g.members_count),
      is_full: g.members_count >= g.capacity,
    }));
  }

  async getGroupDetail(groupId: string) {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['facilitator'],
    });
    if (!group) throw new NotFoundException('گروه یافت نشد');

    const upcomingSessions = await this.sessionRepo.find({
      where: { group_id: groupId, status: 'scheduled' as any },
      order: { session_date: 'ASC' },
      take: 5,
    });

    return {
      ...group,
      available_spots: Math.max(0, group.capacity - group.members_count),
      is_full: group.members_count >= group.capacity,
      upcoming_sessions: upcomingSessions,
    };
  }

  // ── ساخت گروه جدید (توسط فسیلیتیتور/درمانگر) ──────────────────
  async createGroup(actorUserId: string, dto: {
    facilitator_id?: string;
    name: string;
    topic: string;
    description: string;
    schedule: string;
    schedule_weekday?: string;
    schedule_time?: string;
    mode?: 'online' | 'in_person';
    city?: string;
    capacity: number;
    price_per_month: number;
    confidentiality_level?: 'high' | 'medium' | 'standard';
    rules?: string[];
    image_url?: string;
  }, isAdmin = false) {
    if (dto.capacity <= 0) {
      throw new BadRequestException('ظرفیت باید بیشتر از صفر باشد');
    }

    const requestedProfileId = dto.facilitator_id;
    const profiles = await this.dataSource.query(
      `SELECT id,user_id FROM therapist_profiles
       WHERE ($1::uuid IS NOT NULL AND id=$1) OR ($1::uuid IS NULL AND user_id=$2)
       LIMIT 1`,
      [requestedProfileId || null, actorUserId],
    );
    if (!profiles.length) throw new BadRequestException('درمانگر/تسهیلگر معتبر برای گروه انتخاب نشده است');
    if (!isAdmin && profiles[0].user_id !== actorUserId) {
      throw new ForbiddenException('ساخت گروه برای پروفایل دیگر مجاز نیست');
    }
    const { facilitator_id: _ignored, ...groupData } = dto;
    const group = this.groupRepo.create({
      ...groupData,
      facilitator_id: profiles[0].id,
      mode: dto.mode || 'online',
      members_count: 0,
      status: 'active',
      confidentiality_level: dto.confidentiality_level || 'standard',
      rules: dto.rules || [],
    } as any);

    return this.groupRepo.save(group as any);
  }

  async updateGroup(groupId: string, facilitatorId: string, dto: Partial<SupportGroup>, isAdmin = false) {
    const group = await this.assertCanManageGroup(groupId, facilitatorId, isAdmin);

    // ظرفیت نباید کمتر از تعداد اعضای فعلی شود
    if (dto.capacity !== undefined && dto.capacity < group.members_count) {
      throw new BadRequestException('ظرفیت جدید نمی‌تواند کمتر از تعداد اعضای فعلی باشد');
    }

    await this.groupRepo.update(groupId, dto as any);
    return this.groupRepo.findOne({ where: { id: groupId } });
  }

  async closeGroup(groupId: string, facilitatorId: string, isAdmin = false) {
    await this.assertCanManageGroup(groupId, facilitatorId, isAdmin);
    await this.groupRepo.update(groupId, { status: 'closed' });
    return { success: true };
  }

  // ── عضویت در گروه ─────────────────────────────────────────────
  /**
   * عضویت یک کاربر در گروه. این متد فقط ظرفیت را چک و membership را
   * با وضعیت pending_payment می‌سازد. تأیید نهایی بعد از پرداخت
   * موفق از طریق confirmMembershipPayment انجام می‌شود.
   */
  async joinGroup(userId: string, groupId: string, paymentMethod: string = 'zarinpal') {
    const result = await this.dataSource.transaction(async (manager) => {
      // قفل ردیف گروه برای جلوگیری از race condition در ظرفیت
      const group = await manager.query(
        `SELECT * FROM support_groups WHERE id = $1 FOR UPDATE`,
        [groupId],
      );
      if (!group.length) throw new NotFoundException('گروه یافت نشد');
      const g = group[0];

      if (g.status !== 'active') {
        throw new BadRequestException('این گروه دیگر فعال نیست');
      }
      if (g.members_count >= g.capacity) {
        throw new BadRequestException('ظرفیت این گروه پر شده است');
      }

      const existing = await manager.query(
        `SELECT * FROM group_memberships WHERE group_id = $1 AND user_id = $2`,
        [groupId, userId],
      );
      if (existing.length && existing[0].status === 'active') {
        throw new BadRequestException('شما قبلاً عضو این گروه هستید');
      }

      let membership;
      if (existing.length) {
        // عضویت قبلی (left/removed) - دوباره فعال می‌شود با وضعیت pending_payment
        const updated = mutationRows<any>(await manager.query(
          `UPDATE group_memberships SET status = 'pending_payment', left_at = NULL, updated_at = NOW()
           WHERE id = $1 RETURNING *`,
          [existing[0].id],
        ));
        if (!updated.length) throw new NotFoundException('عضویت یافت نشد');
        membership = updated[0];
      } else {
        const inserted = await manager.query(
          `INSERT INTO group_memberships (group_id, user_id, status)
           VALUES ($1, $2, 'pending_payment') RETURNING *`,
          [groupId, userId],
        );
        membership = inserted[0];
      }

      return {
        membership_id: membership.id,
        group_id: groupId,
        price_per_month: Number(g.price_per_month),
        status: 'pending_payment',
      };
    });

    // FIX: پرداخت واقعی بعد از transaction اتمیک
    const price = Number(result.price_per_month);

    if (!price || price <= 0) {
      // گروه رایگان — تأیید فوری
      await this.dataSource.query(
        `UPDATE group_memberships SET status = 'active', updated_at = NOW() WHERE id = $1`,
        [result.membership_id],
      );
      return {
        ...result,
        status: 'active',
        paymentUrl: null,
        message: 'عضویت رایگان با موفقیت ثبت شد ✅',
      };
    }

    if (paymentMethod === 'wallet') {
      try {
        await this.dataSource.transaction(async (manager) => {
          await this.walletService.debitWallet(
            userId, price, `عضویت در گروه هم‌زیسته`, undefined, manager,
          );
          await manager.query(
            `UPDATE group_memberships SET status='active',updated_at=NOW() WHERE id=$1`,
            [result.membership_id],
          );
        });
        return { ...result, status: 'active', paymentUrl: null, message: 'پرداخت از کیف پول انجام شد و عضویت فعال شد ✅' };
      } catch (err: any) {
        await this.dataSource.query(
          `DELETE FROM group_memberships WHERE id = $1`, [result.membership_id],
        );
        throw new BadRequestException(err.message || 'موجودی کیف پول کافی نیست');
      }
    }

    // زرین‌پال
    try {
      const payment = await this.paymentService.requestPayment({
        userId,
        amount: price,
        description: `عضویت در گروه هم‌زیسته`,
        type: 'booking' as any,
      });
      return { ...result, paymentUrl: payment.paymentUrl, message: 'در حال انتقال به درگاه پرداخت...' };
    } catch (err: any) {
      await this.dataSource.query(
        `DELETE FROM group_memberships WHERE id = $1`, [result.membership_id],
      );
      throw new BadRequestException(err.message || 'خطا در اتصال به درگاه پرداخت');
    }
  }

  /**
   * تأیید عضویت پس از پرداخت موفق - افزایش members_count به‌صورت اتمیک
   */
  async confirmMembershipPayment(membershipId: string, paymentId: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const memberships = await manager.query(
        `SELECT * FROM group_memberships WHERE id = $1 FOR UPDATE`,
        [membershipId],
      );
      if (!memberships.length) throw new NotFoundException('عضویت یافت نشد');
      const membership = memberships[0];

      if (membership.status === 'active') {
        return { success: true, message: 'این عضویت قبلاً تأیید شده است' };
      }

      const groups = await manager.query(
        `SELECT * FROM support_groups WHERE id = $1 FOR UPDATE`,
        [membership.group_id],
      );
      if (!groups.length) throw new NotFoundException('گروه یافت نشد');
      const group = groups[0];

      if (group.members_count >= group.capacity) {
        throw new BadRequestException('ظرفیت گروه در این فاصله پر شده است. مبلغ بازگشت داده خواهد شد');
      }

      const nextPaymentDue = new Date();
      nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

      await manager.query(
        `UPDATE group_memberships
         SET status = 'active', payment_id = $1, next_payment_due = $2, updated_at = NOW()
         WHERE id = $3`,
        [paymentId, nextPaymentDue, membershipId],
      );

      await manager.query(
        `UPDATE support_groups SET members_count = members_count + 1, updated_at = NOW() WHERE id = $1`,
        [membership.group_id],
      );

      return { success: true, message: 'عضویت با موفقیت تأیید شد', next_payment_due: nextPaymentDue };
    });
  }

  async leaveGroup(userId: string, groupId: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const memberships = await manager.query(
        `SELECT * FROM group_memberships WHERE group_id = $1 AND user_id = $2 AND status = 'active' FOR UPDATE`,
        [groupId, userId],
      );
      if (!memberships.length) throw new NotFoundException('عضویت فعالی برای شما در این گروه یافت نشد');

      await manager.query(
        `UPDATE group_memberships SET status = 'left', left_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [memberships[0].id],
      );

      await manager.query(
        `UPDATE support_groups SET members_count = GREATEST(0, members_count - 1), updated_at = NOW() WHERE id = $1`,
        [groupId],
      );

      return { success: true, message: 'از گروه خارج شدید' };
    });
  }

  /** ادمین/فسیلیتیتور: حذف یک عضو از گروه */
  async removeMember(membershipId: string, requesterId: string, isAdmin = false) {
    const membership = await this.membershipRepo.findOne({ where: { id: membershipId } });
    if (!membership) throw new NotFoundException('عضویت یافت نشد');

    await this.assertCanManageGroup(membership.group_id, requesterId, isAdmin);

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `UPDATE group_memberships SET status = 'removed', left_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [membershipId],
      );
      await manager.query(
        `UPDATE support_groups SET members_count = GREATEST(0, members_count - 1), updated_at = NOW() WHERE id = $1`,
        [membership.group_id],
      );
    });

    return { success: true };
  }

  async getMyMemberships(userId: string) {
    return this.dataSource.query(
      `
      SELECT
        gm.*,
        sg.name as group_name, sg.topic, sg.schedule, sg.mode, sg.city,
        sg.price_per_month, sg.image_url, sg.status as group_status,
        COALESCE(fu.name,'') as facilitator_name
      FROM group_memberships gm
      JOIN support_groups sg ON sg.id = gm.group_id
      LEFT JOIN therapist_profiles tp ON tp.id = sg.facilitator_id
      LEFT JOIN users fu ON fu.id = tp.user_id
      WHERE gm.user_id = $1
      ORDER BY gm.created_at DESC
      `,
      [userId],
    );
  }

  // ── مدیریت جلسات گروه (توسط فسیلیتیتور) ────────────────────────
  async scheduleSession(groupId: string, facilitatorId: string, dto: {
    session_date: string;
    session_number?: number;
    topic?: string;
  }, isAdmin = false) {
    await this.assertCanManageGroup(groupId, facilitatorId, isAdmin);

    const session = this.sessionRepo.create({
      group_id: groupId,
      session_date: new Date(dto.session_date),
      session_number: dto.session_number,
      topic: dto.topic,
      status: 'scheduled',
    });
    return this.sessionRepo.save(session);
  }

  async markAttendance(
    sessionId: string,
    attendanceList: { membership_id: string; attended: boolean }[],
    requesterId: string,
    isAdmin = false,
  ) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('جلسه یافت نشد');
    await this.assertCanManageGroup(session.group_id, requesterId, isAdmin);
    if (!Array.isArray(attendanceList) || !attendanceList.length) {
      throw new BadRequestException('لیست حضور و غیاب خالی است');
    }
    await this.dataSource.transaction(async (manager) => {
      for (const item of attendanceList) {
        const membership = await manager.query(
          `SELECT id FROM group_memberships WHERE id=$1 AND group_id=$2 LIMIT 1`,
          [item.membership_id, session.group_id],
        );
        if (!membership.length) throw new BadRequestException('عضویت انتخاب‌شده متعلق به این گروه نیست');
        await manager.query(
          `INSERT INTO group_session_attendance(session_id,membership_id,attended,marked_at)
           VALUES($1,$2,$3,NOW())
           ON CONFLICT(session_id,membership_id) DO UPDATE SET attended=EXCLUDED.attended,marked_at=NOW()`,
          [sessionId, item.membership_id, !!item.attended],
        );
        await manager.query(
          `UPDATE group_memberships SET sessions_attended=(
             SELECT COUNT(*)::int FROM group_session_attendance
             WHERE membership_id=$1 AND attended=true
           ),updated_at=NOW() WHERE id=$1`,
          [item.membership_id],
        );
      }
      await manager.query(`UPDATE group_sessions SET status='completed' WHERE id=$1`, [sessionId]);
    });
    return { success: true };
  }

  async getGroupMembers(groupId: string, facilitatorId: string, isAdmin = false) {
    await this.assertCanManageGroup(groupId, facilitatorId, isAdmin);

    return this.dataSource.query(
      `
      SELECT
        gm.id as membership_id, gm.status, gm.joined_at, gm.sessions_attended,
        gm.next_payment_due,
        u.id as user_id, u.name as user_name, u.phone_number as user_phone
      FROM group_memberships gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = $1 AND gm.status IN ('active', 'pending_payment')
      ORDER BY gm.joined_at ASC
      `,
      [groupId],
    );
  }

  /** فسیلیتیتورهای دارای گروه - برای پنل مدیریت آن‌ها */
  async getMyGroups(facilitatorId: string) {
    const profile = await this.dataSource.query(`SELECT id FROM therapist_profiles WHERE user_id=$1 LIMIT 1`, [facilitatorId]);
    if (!profile.length) return [];
    const groups = await this.groupRepo.find({ where: { facilitator_id: profile[0].id }, order: { created_at: 'DESC' } });
    return groups.map((g) => ({
      ...g,
      available_spots: Math.max(0, g.capacity - g.members_count),
    }));
  }

  /** پاسخ به پرداخت‌های ماهانه رسیده — برای کرون یادآوری */
  async getUpcomingPaymentsDue(daysAhead = 3) {
    const safeDays = Number.isFinite(daysAhead) ? Math.max(1, Math.min(30, Math.trunc(daysAhead))) : 3;
    return this.dataSource.query(
      `
      SELECT
        gm.id as membership_id, gm.next_payment_due,
        u.id as user_id, u.phone_number as user_phone,
        sg.name as group_name, sg.price_per_month
      FROM group_memberships gm
      JOIN users u ON u.id = gm.user_id
      JOIN support_groups sg ON sg.id = gm.group_id
      WHERE gm.status = 'active'
        AND gm.next_payment_due BETWEEN NOW() AND NOW() + ($1 * INTERVAL '1 day')
      `,
      [safeDays],
    );
  }

  private async assertCanManageGroup(groupId: string, requesterUserId: string, isAdmin: boolean) {
    const rows = await this.dataSource.query(
      `SELECT g.* FROM support_groups g
       LEFT JOIN therapist_profiles tp ON tp.id=g.facilitator_id
       WHERE g.id=$1 AND ($2::boolean=true OR tp.user_id=$3)
       LIMIT 1`,
      [groupId, isAdmin, requesterUserId],
    );
    if (!rows.length) {
      const exists = await this.groupRepo.exist({ where: { id: groupId } });
      if (!exists) throw new NotFoundException('گروه یافت نشد');
      throw new ForbiddenException('شما مجاز به این عملیات نیستید');
    }
    return rows[0] as SupportGroup;
  }
}
