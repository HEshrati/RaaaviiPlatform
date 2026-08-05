import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RgciCalculatorService } from '../rgci/rgci-calculator.service';

@Injectable()
export class MatchingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly calculator: RgciCalculatorService,
  ) {}

  // ۱. ورود کاربر به صف مچینگ رویداد
  async joinQueue(eventId: string, userId: string) {
    // بررسی اینکه آیا کاربر قبلاً پروفایل رفتاری ساخته است؟
    const profile = await this.dataSource.query(
      `SELECT id FROM user_rgci_profiles WHERE user_id = $1`, [userId]
    );
    if (!profile.length) {
      throw new BadRequestException('ابتدا باید پرسشنامه RGCI را تکمیل کنید.');
    }

    await this.dataSource.query(
      `INSERT INTO match_queue (event_id, user_id, status, joined_at)
       VALUES ($1, $2, 'waiting', NOW())
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'waiting'`,
      [eventId, userId]
    );

    return { status: 'success', message: 'شما با موفقیت وارد صف مچینگ شدید.' };
  }

  // ۲. بدنه اصلی موتور الگوریتم تشکیل گروه‌ها (بخش ۴.۴ و ۴.۶ داکیومنت)
  async executeMatchingEngine(eventId: string) {
    const result = await this.runMatchingForEvent(eventId);
    if (!result.groups) {
      throw new BadRequestException('تعداد کاربران واجد شرایط برای تشکیل گروه کافی نیست (حداقل ۴ نفر).');
    }
    return { status: 'success', groups_created: result.groups, members_matched: result.members };
  }

  // ── متدهای مورد نیاز توسط controller و scheduler ──────────

  // createSmartGroups — مورد استفاده matching.controller.ts
  async createSmartGroups(
    eventId: string,
    userIds: string[],
    groupSize: number = 6,
    strategy: string = 'mixed',
  ) {
    // بارگذاری پروفایل‌ها
    const profiles = await this.loadRgciProfiles(userIds);
    if (profiles.length < 4) return [];
    const pairScores = this.computeAllPairScores(profiles);
    await this.savePairScores(eventId, pairScores);
    const groups = this.formGroups(profiles, pairScores, 4, groupSize, true, strategy);
    const saved = [];
    for (const g of groups) {
      const result = await this.saveGroup(eventId, g, pairScores);
      saved.push(result);
    }
    await this.updateQueueStatus(eventId, saved.flatMap((g: any) => g.member_ids || []));
    return saved;
  }

  // runMatchingForEvent — مورد استفاده matching.scheduler.ts
  async runMatchingForEvent(eventId: string, strategy: string = 'mixed') {
    const eventRows = await this.dataSource.query(
      `SELECT LEAST(8, GREATEST(4, COALESCE(min_group_size, 4))) AS min_size,
              LEAST(8, GREATEST(4, COALESCE(max_group_size, 8))) AS max_size
       FROM events WHERE id=$1`,
      [eventId],
    );
    if (!eventRows.length) throw new BadRequestException('رویداد یافت نشد');
    const minSize = Number(eventRows[0].min_size);
    const queueRows = await this.dataSource.query(
      `SELECT user_id FROM match_queue WHERE event_id=$1 AND status='waiting'`,
      [eventId],
    );
    if (!queueRows.length) return { groups: 0, members: 0 };
    const userIds = queueRows.map((r: any) => r.user_id);
    const profiles = await this.loadRgciProfiles(userIds);
    const eligibleIds = new Set(profiles.map((profile: any) => profile.user_id));
    const incompleteIds = userIds.filter((id: string) => !eligibleIds.has(id));
    if (incompleteIds.length) {
      await this.dataSource.query(
        `UPDATE match_queue SET status='needs_profile_completion' WHERE event_id=$1 AND user_id=ANY($2)`,
        [eventId, incompleteIds],
      );
    }
    if (profiles.length < minSize) return { groups: 0, members: 0, needs_profile_completion: incompleteIds.length };

    const pairScores = this.computeAllPairScores(profiles);
    await this.savePairScores(eventId, pairScores);
    const groups = this.formGroups(profiles, pairScores, minSize, Number(eventRows[0].max_size), true, strategy);
    const saved = [];
    for (const group of groups) saved.push(await this.saveGroup(eventId, group, pairScores));
    const matchedIds = groups.flatMap((group: any) => group.members.map((member: any) => member.user_id));
    await this.updateQueueStatus(eventId, matchedIds);
    return { groups: saved.length, members: matchedIds.length, needs_profile_completion: incompleteIds.length };
  }

  // ── helper methods ─────────────────────────────────────────

  private async loadRgciProfiles(userIds: string[]) {
    if (!userIds.length) return [];
    const rows = await this.dataSource.query(
      `SELECT user_id,
          psychological_need_score AS psychological_need,
          goal_score               AS goal,
          participation_score      AS participation,
          safety_score             AS safety,
          diversity_score          AS diversity,
          performance_score, burnout_risk, wellbeing_score, satisfaction_score
       FROM user_rgci_profiles WHERE user_id = ANY($1)`,
      [userIds],
    );
    return rows;
  }

  private computeAllPairScores(profiles: any[]) {
    const scores = new Map<string, any>();
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const a = profiles[i];
        const b = profiles[j];
        const dimA = { psychological_need: Number(a.psychological_need), goal: Number(a.goal), participation: Number(a.participation), safety: Number(a.safety), diversity: Number(a.diversity) };
        const dimB = { psychological_need: Number(b.psychological_need), goal: Number(b.goal), participation: Number(b.participation), safety: Number(b.safety), diversity: Number(b.diversity) };
        const res = this.calculator.calculatePairCompatibility(dimA, dimB);
        const [userA, userB] = [a.user_id, b.user_id].sort();
        const key = `${userA}:${userB}`;
        scores.set(key, { userA, userB, score: res.score, breakdown: res.breakdown });
      }
    }
    return scores;
  }

  private getPairScore(pairScores: Map<string, any>, uidA: string, uidB: string): number {
    const key = [uidA, uidB].sort().join(':');
    return pairScores.get(key)?.score ?? 0.5;
  }

  private formGroups(
    profiles: any[], pairScores: Map<string, any>, minSize: number, maxSize: number,
    allowFallback: boolean, strategy: string = 'mixed',
  ) {
    minSize = Math.max(4, Math.min(8, Number(minSize || 4)));
    maxSize = Math.max(minSize, Math.min(8, Number(maxSize || 8)));
    const sizes = this.planGroupSizes(profiles.length, minSize, maxSize, 6);
    if (!sizes.length) return [];

    // مطابق سند، افراد با ریسک فرسودگی/ایمنی پایین زودتر seed می‌شوند تا
    // در انتهای الگوریتم به یک گروه نامناسب تحمیل نشوند.
    const risk = (p: any) =>
      0.55 * Number(p.burnout_risk || 0) + 0.45 * (100 - Number(p.safety || 0));
    const unassigned = [...profiles].sort((a, b) => risk(b) - risk(a));
    const groups: any[] = [];

    for (const targetSize of sizes) {
      const members = [unassigned.shift()!];
      while (members.length < targetSize) {
        let bestIndex = 0;
        let bestScore = -Infinity;
        for (let i = 0; i < unassigned.length; i++) {
          const score = this.groupUtility([...members, unassigned[i]], pairScores, strategy);
          if (score > bestScore) { bestScore = score; bestIndex = i; }
        }
        members.push(unassigned.splice(bestIndex, 1)[0]);
      }
      const utility = this.groupUtility(members, pairScores, strategy);
      groups.push({ members, fallback_used: allowFallback && utility < 0.65 });
    }

    // مرحلهٔ repair سبک: جابه‌جایی دونفره فقط وقتی مجموع کیفیت دو گروه بهتر شود.
    for (let pass = 0; pass < 3; pass++) {
      let improved = false;
      for (let a = 0; a < groups.length; a++) {
        for (let b = a + 1; b < groups.length; b++) {
          const baseline = this.groupUtility(groups[a].members, pairScores, strategy)
            + this.groupUtility(groups[b].members, pairScores, strategy);
          let best: { i: number; j: number; score: number } | null = null;
          for (let i = 0; i < groups[a].members.length; i++) {
            for (let j = 0; j < groups[b].members.length; j++) {
              const ga = [...groups[a].members];
              const gb = [...groups[b].members];
              [ga[i], gb[j]] = [gb[j], ga[i]];
              const candidate = this.groupUtility(ga, pairScores, strategy)
                + this.groupUtility(gb, pairScores, strategy);
              if (candidate > baseline + 0.005 && (!best || candidate > best.score)) best = { i, j, score: candidate };
            }
          }
          if (best) {
            [groups[a].members[best.i], groups[b].members[best.j]] =
              [groups[b].members[best.j], groups[a].members[best.i]];
            improved = true;
          }
        }
      }
      if (!improved) break;
    }
    for (const group of groups) {
      group.fallback_used = allowFallback && this.groupUtility(group.members, pairScores, strategy) < 0.65;
    }
    return groups;
  }

  private planGroupSizes(total: number, minSize: number, maxSize: number, idealSize: number): number[] {
    if (total < minSize) return [];
    const minGroups = Math.ceil(total / maxSize);
    const maxGroups = Math.floor(total / minSize);
    let groupCount = minGroups;
    let bestDistance = Infinity;
    for (let count = minGroups; count <= maxGroups; count++) {
      const distance = Math.abs(total / count - idealSize);
      if (distance < bestDistance) { bestDistance = distance; groupCount = count; }
    }
    const base = Math.floor(total / groupCount);
    const extra = total % groupCount;
    return Array.from({ length: groupCount }, (_, index) => base + (index < extra ? 1 : 0));
  }

  private groupUtility(members: any[], pairScores: Map<string, any>, strategy: string): number {
    if (members.length < 2) return 0.5;
    const pairs: number[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        pairs.push(this.getPairScore(pairScores, members[i].user_id, members[j].user_id));
      }
    }
    const average = (field: string, fallback = 50) =>
      members.reduce((sum, member) => sum + Number(member[field] ?? fallback), 0) / members.length;
    const compatibility = pairs.reduce((sum, value) => sum + value, 0) / pairs.length;
    let utility = this.calculator.calculateGroupScore(
      compatibility, average('performance_score'), average('wellbeing_score'), average('satisfaction_score'),
    );
    const minPair = Math.min(...pairs);
    const riskyPairs = pairs.filter((value) => value < 0.40).length;
    if (minPair < 0.40) utility -= 0.08;
    if (riskyPairs >= 2) utility -= 0.06;

    const safety = average('safety') / 100;
    const goal = average('goal') / 100;
    const need = average('psychological_need') / 100;
    const normalizedStrategy = String(strategy || '').toLowerCase().replace(/[_\s-]/g, '');
    if (normalizedStrategy.includes('hamravan') || normalizedStrategy.includes('همروان')) {
      utility += 0.08 * ((safety + goal) / 2);
    } else if (normalizedStrategy.includes('yakh') || normalizedStrategy.includes('یخ')) {
      utility += 0.08 * (1 - (Math.abs(safety - 0.50) + Math.abs(goal - 0.50)) / 2);
    } else if (normalizedStrategy.includes('hamzist') || normalizedStrategy.includes('همزیست')) {
      utility += 0.08 * ((safety + goal + need) / 3);
    }
    return utility;
  }

  private async saveGroup(eventId: string, group: any, pairScores: Map<string, any>) {
    const members = group.members;
    let totalCompat = 0, pairs = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        totalCompat += this.getPairScore(pairScores, members[i].user_id, members[j].user_id);
        pairs++;
      }
    }
    const compatibility = pairs > 0 ? totalCompat / pairs : 0.65;
    const avgPerf = members.reduce((s: number, m: any) => s + Number(m.performance_score || 50), 0) / members.length;
    const avgWell = members.reduce((s: number, m: any) => s + Number(m.wellbeing_score || 50), 0) / members.length;
    const avgSat  = members.reduce((s: number, m: any) => s + Number(m.satisfaction_score || 50), 0) / members.length;
    const group_score = this.calculator.calculateGroupScore(compatibility, avgPerf, avgWell, avgSat);
    let quality_label = this.calculator.getQualityLabel(group_score);
    const pairValues: number[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        pairValues.push(this.getPairScore(pairScores, members[i].user_id, members[j].user_id));
      }
    }
    const minPairScore = pairValues.length ? Math.min(...pairValues) : 0;
    const averageBurnout = members.reduce((sum: number, member: any) => sum + Number(member.burnout_risk || 0), 0) / members.length;
    const minimumSafety = Math.min(...members.map((member: any) => Number(member.safety || 0)));
    const riskPairCount = pairValues.filter((score) => score < 0.40).length;
    const pairMean = compatibility;
    const pairVariance = pairValues.length
      ? pairValues.reduce((sum, value) => sum + Math.pow(value - pairMean, 2), 0) / pairValues.length : 0;
    const participationValues = members.map((member: any) => Number(member.participation || 0) / 100);
    const participationMean = participationValues.reduce((sum: number, value: number) => sum + value, 0) / participationValues.length;
    const participationVariance = participationValues.reduce(
      (sum: number, value: number) => sum + Math.pow(value - participationMean, 2), 0,
    ) / participationValues.length;
    const maxBurnout = Math.max(...members.map((member: any) => Number(member.burnout_risk || 0)));
    // قاعدهٔ تنزل کیفیت سند: گروه پرریسک حذف نمی‌شود، اما برچسب تحلیلی
    // محافظه‌کارانه‌تری می‌گیرد تا برای بازبینی تسهیلگر قابل مشاهده باشد.
    if (minPairScore < 0.40 || averageBurnout > 70 || maxBurnout > 85 || minimumSafety < 25
      || riskPairCount >= 2 || participationVariance > 0.20) {
      quality_label = quality_label === 'optimal' ? 'acceptable' : quality_label === 'acceptable' ? 'fallback' : 'critical';
    }

    const gRows = await this.dataSource.query(
      `INSERT INTO groups (
         event_id, size, quality_label, compatibility_score, group_score, fallback_used,
         min_pair_score, pair_score_variance, risk_pair_count, minimum_safety, participation_variance, created_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING id`,
      [eventId, members.length, quality_label, compatibility, group_score, group.fallback_used || false,
       minPairScore, pairVariance, riskPairCount, minimumSafety / 100, participationVariance],
    );
    const groupId = gRows[0].id;

    await this.dataSource.query(
      `INSERT INTO group_predicted_indices (group_id, predicted_performance, predicted_burnout, predicted_wellbeing, predicted_satisfaction)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (group_id) DO NOTHING`,
      [groupId, avgPerf / 100, averageBurnout / 100, avgWell / 100, avgSat / 100],
    );

    for (const m of members) {
      const assignmentType = group.fallback_used ? 'fallback' : quality_label;
      await this.dataSource.query(
        `INSERT INTO group_members (group_id, user_id, event_id, assignment_type, assigned_at)
         VALUES ($1,$2,$3,$4,NOW()) ON CONFLICT (group_id, user_id) DO NOTHING`,
        [groupId, m.user_id, eventId, assignmentType],
      );
      await this.dataSource.query(
        `UPDATE bookings SET group_id=$1,matching_status='matched',updated_at=NOW()
         WHERE event_id=$2 AND user_id=$3
           AND status IN ('confirmed','matched','completed')
           AND payment_status IN ('paid','free')`,
        [groupId, eventId, m.user_id],
      );
      await this.dataSource.query(
        `INSERT INTO user_assignment_logs (event_id, user_id, group_id, assignment_type, assignment_reason)
         VALUES ($1,$2,$3,$4,$5)`,
        [eventId, m.user_id, groupId, assignmentType,
         group.fallback_used ? 'No optimal group found; fallback assignment.' : 'standard assignment'],
      ).catch(() => {});
    }

    return {
      group_id: groupId, member_ids: members.map((member: any) => member.user_id),
      size: members.length, quality_label, compatibility_score: Math.round(compatibility * 1000) / 1000,
      group_score, fallback_used: group.fallback_used || false,
    };
  }

  private async savePairScores(eventId: string, pairScores: Map<string, any>) {
    for (const [, ps] of pairScores) {
      await this.dataSource.query(
        `INSERT INTO pair_scores (event_id, user_a_id, user_b_id, compatibility_score, dimension_breakdown)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (event_id, user_a_id, user_b_id) DO UPDATE
           SET compatibility_score=EXCLUDED.compatibility_score, dimension_breakdown=EXCLUDED.dimension_breakdown, calculated_at=NOW()`,
        [eventId, ps.userA, ps.userB, ps.score, JSON.stringify(ps.breakdown)],
      ).catch(() => {});
    }
  }

  private async updateQueueStatus(eventId: string, userIds: string[]) {
    if (!userIds.length) return;
    await this.dataSource.query(
      `UPDATE match_queue SET status='matched', matched_at=NOW()
       WHERE event_id=$1 AND user_id=ANY($2)`,
      [eventId, userIds],
    );
  }


  // GET match-queue/status
  async getQueueStatus(eventId: string) {
    const rows = await this.dataSource.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'waiting') AS total_waiting,
         COUNT(*) FILTER (WHERE status = 'matched') AS total_matched,
         COUNT(*)                                    AS total_users
       FROM match_queue WHERE event_id = $1`,
      [eventId],
    );
    const total    = Number(rows[0].total_users);
    const waiting  = Number(rows[0].total_waiting);
    const matched  = Number(rows[0].total_matched);
    return {
      event_id:           eventId,
      queue_status:       waiting > 0 ? 'open' : 'closed',
      total_users:        total,
      waiting_users:      waiting,
      matched_users:      matched,
      ready_for_matching: waiting >= 4,
      min_group_size:     4,
      max_group_size:     8,
    };
  }
}
