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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const rgci_calculator_service_1 = require("../rgci/rgci-calculator.service");
let MatchingService = class MatchingService {
    constructor(dataSource, calculator) {
        this.dataSource = dataSource;
        this.calculator = calculator;
    }
    // ۱. ورود کاربر به صف مچینگ رویداد
    async joinQueue(eventId, userId) {
        // بررسی اینکه آیا کاربر قبلاً پروفایل رفتاری ساخته است؟
        const profile = await this.dataSource.query(`SELECT id FROM user_rgci_profiles WHERE user_id = $1`, [userId]);
        if (!profile.length) {
            throw new common_1.BadRequestException('ابتدا باید پرسشنامه RGCI را تکمیل کنید.');
        }
        await this.dataSource.query(`INSERT INTO match_queue (event_id, user_id, status, joined_at)
       VALUES ($1, $2, 'waiting', NOW())
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'waiting'`, [eventId, userId]);
        return { status: 'success', message: 'شما با موفقیت وارد صف مچینگ شدید.' };
    }
    // ۲. بدنه اصلی موتور الگوریتم تشکیل گروه‌ها (بخش ۴.۴ و ۴.۶ داکیومنت)
    async executeMatchingEngine(eventId) {
        // دریافت تمام کاربران منتظر در صف به همراه پروفایل رفتاری‌شان
        const queueUsers = await this.dataSource.query(`SELECT q.user_id, p.psychological_need_score, p.goal_score, p.participation_score, p.safety_score, p.diversity_score,
              p.performance_score, p.wellbeing_score, p.satisfaction_score
       FROM match_queue q
       JOIN user_rgci_profiles p ON q.user_id = p.user_id
       WHERE q.event_id = $1 AND q.status = 'waiting'`, [eventId]);
        if (queueUsers.length < 4) {
            throw new common_1.BadRequestException('تعداد افراد در صف برای تشکیل گروه کافی نیست (حداقل ۴ نفر).');
        }
        // نمونه ساده‌سازی شده تشکیل گروه ۴ نفره بر اساس داکیومنت
        // در سیستم عملیاتی این بخش باید ماتریس سازگاری جفتی pair_scores را پر کند و بهینه‌ترین حالت را گراف‌بندی کند
        const chunkedUsers = [];
        let tempChunk = [];
        for (const user of queueUsers) {
            tempChunk.push(user);
            if (tempChunk.length === 4) {
                chunkedUsers.push([...tempChunk]);
                tempChunk = [];
            }
        }
        // ذخیره گروه‌های تشکیل شده
        for (const groupUsers of chunkedUsers) {
            // محاسبه میانگین شاخص‌ها برای گروه
            const avgPerformance = groupUsers.reduce((acc, u) => acc + Number(u.performance_score), 0) / groupUsers.length;
            const avgWellbeing = groupUsers.reduce((acc, u) => acc + Number(u.wellbeing_score), 0) / groupUsers.length;
            const avgSatisfaction = groupUsers.reduce((acc, u) => acc + Number(u.satisfaction_score), 0) / groupUsers.length;
            // فرض میزان سازگاری جفتی میانگین (Compatibility Score)
            const mockCompatibility = 0.78;
            // فرمول اصلی امتیاز گروه از فایل rgci-calculator.service
            const groupScore = this.calculator.calculateGroupScore(mockCompatibility, avgPerformance, avgWellbeing, avgSatisfaction);
            const qualityLabel = this.calculator.getQualityLabel(groupScore);
            // ایجاد گروه در دیتابیس
            const groupRow = await this.dataSource.query(`INSERT INTO groups (event_id, size, quality_label, compatibility_score, group_score, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`, [eventId, groupUsers.length, qualityLabel, mockCompatibility, groupScore]);
            const groupId = groupRow[0].id;
            // اضافه کردن اعضا به همراه سیاست نویسی لاگ (No User Left Behind)
            for (const member of groupUsers) {
                await this.dataSource.query(`INSERT INTO group_members (group_id, user_id, event_id, assignment_type, assigned_at)
           VALUES ($1, $2, $3, $4, NOW())`, [groupId, member.user_id, eventId, qualityLabel]);
                // آپدیت وضعیت در صف
                await this.dataSource.query(`UPDATE match_queue SET status = 'matched', matched_at = NOW() WHERE event_id = $1 AND user_id = $2`, [eventId, member.user_id]);
            }
        }
        return { status: 'success', groups_created: chunkedUsers.length };
    }
    // ── متدهای مورد نیاز توسط controller و scheduler ──────────
    // createSmartGroups — مورد استفاده matching.controller.ts
    async createSmartGroups(eventId, userIds, groupSize = 5, strategy = 'mixed') {
        // بارگذاری پروفایل‌ها
        const profiles = await this.loadRgciProfiles(userIds);
        const pairScores = this.computeAllPairScores(profiles);
        await this.savePairScores(eventId, pairScores);
        const groups = this.formGroups(profiles, pairScores, 4, groupSize, true);
        const saved = [];
        for (const g of groups) {
            const result = await this.saveGroup(eventId, g, pairScores);
            saved.push(result);
        }
        await this.updateQueueStatus(eventId, userIds);
        return saved;
    }
    // runMatchingForEvent — مورد استفاده matching.scheduler.ts
    async runMatchingForEvent(eventId, strategy = 'mixed') {
        const queueRows = await this.dataSource.query(`SELECT user_id FROM match_queue WHERE event_id=$1 AND status='waiting'`, [eventId]);
        if (!queueRows.length)
            return { groups: 0, members: 0 };
        const userIds = queueRows.map((r) => r.user_id);
        const saved = await this.createSmartGroups(eventId, userIds, 5, strategy);
        return { groups: saved.length, members: userIds.length };
    }
    // ── helper methods ─────────────────────────────────────────
    async loadRgciProfiles(userIds) {
        if (!userIds.length)
            return [];
        const rows = await this.dataSource.query(`SELECT user_id,
          psychological_need_score AS psychological_need,
          goal_score               AS goal,
          participation_score      AS participation,
          safety_score             AS safety,
          diversity_score          AS diversity,
          performance_score, wellbeing_score, satisfaction_score
       FROM user_rgci_profiles WHERE user_id = ANY($1)`, [userIds]);
        const found = new Set(rows.map((r) => r.user_id));
        const defaults = userIds
            .filter((uid) => !found.has(uid))
            .map((uid) => ({
            user_id: uid,
            psychological_need: 50, goal: 50, participation: 50,
            safety: 50, diversity: 50,
            performance_score: 50, wellbeing_score: 50, satisfaction_score: 50,
        }));
        return [...rows, ...defaults];
    }
    computeAllPairScores(profiles) {
        const scores = new Map();
        for (let i = 0; i < profiles.length; i++) {
            for (let j = i + 1; j < profiles.length; j++) {
                const a = profiles[i];
                const b = profiles[j];
                const dimA = { psychological_need: Number(a.psychological_need), goal: Number(a.goal), participation: Number(a.participation), safety: Number(a.safety), diversity: Number(a.diversity) };
                const dimB = { psychological_need: Number(b.psychological_need), goal: Number(b.goal), participation: Number(b.participation), safety: Number(b.safety), diversity: Number(b.diversity) };
                const res = this.calculator.calculatePairCompatibility(dimA, dimB);
                const key = [a.user_id, b.user_id].sort().join(':');
                scores.set(key, { userA: a.user_id, userB: b.user_id, score: res.score, breakdown: res.breakdown });
            }
        }
        return scores;
    }
    getPairScore(pairScores, uidA, uidB) {
        const key = [uidA, uidB].sort().join(':');
        return pairScores.get(key)?.score ?? 0.5;
    }
    formGroups(profiles, pairScores, minSize, maxSize, allowFallback) {
        const unassigned = [...profiles];
        const groups = [];
        while (unassigned.length >= minSize) {
            const seed = unassigned.shift();
            const group = [seed];
            while (group.length < maxSize && unassigned.length > 0) {
                let bestIdx = -1, bestAvg = -1;
                for (let i = 0; i < unassigned.length; i++) {
                    const avg = group.reduce((s, m) => s + this.getPairScore(pairScores, m.user_id, unassigned[i].user_id), 0) / group.length;
                    if (avg > bestAvg) {
                        bestAvg = avg;
                        bestIdx = i;
                    }
                }
                if (bestIdx === -1 || bestAvg < 0.3)
                    break;
                group.push(unassigned.splice(bestIdx, 1)[0]);
            }
            if (group.length >= minSize) {
                groups.push({ members: group, fallback_used: false });
            }
            else if (allowFallback) {
                unassigned.unshift(...group);
                break;
            }
        }
        if (unassigned.length > 0 && allowFallback) {
            if (groups.length > 0 && groups[groups.length - 1].members.length + unassigned.length <= maxSize) {
                groups[groups.length - 1].members.push(...unassigned);
                groups[groups.length - 1].fallback_used = true;
            }
            else if (unassigned.length >= 2) {
                groups.push({ members: unassigned, fallback_used: true });
            }
        }
        return groups;
    }
    async saveGroup(eventId, group, pairScores) {
        const members = group.members;
        let totalCompat = 0, pairs = 0;
        for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
                totalCompat += this.getPairScore(pairScores, members[i].user_id, members[j].user_id);
                pairs++;
            }
        }
        const compatibility = pairs > 0 ? totalCompat / pairs : 0.65;
        const avgPerf = members.reduce((s, m) => s + Number(m.performance_score || 50), 0) / members.length;
        const avgWell = members.reduce((s, m) => s + Number(m.wellbeing_score || 50), 0) / members.length;
        const avgSat = members.reduce((s, m) => s + Number(m.satisfaction_score || 50), 0) / members.length;
        const group_score = this.calculator.calculateGroupScore(compatibility, avgPerf, avgWell, avgSat);
        const quality_label = this.calculator.getQualityLabel(group_score);
        const gRows = await this.dataSource.query(`INSERT INTO groups (event_id, size, quality_label, compatibility_score, group_score, fallback_used, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING id`, [eventId, members.length, quality_label, compatibility, group_score, group.fallback_used || false]);
        const groupId = gRows[0].id;
        await this.dataSource.query(`INSERT INTO group_predicted_indices (group_id, predicted_performance, predicted_wellbeing, predicted_satisfaction)
       VALUES ($1,$2,$3,$4) ON CONFLICT (group_id) DO NOTHING`, [groupId, avgPerf / 100, avgWell / 100, avgSat / 100]);
        for (const m of members) {
            const assignmentType = group.fallback_used ? 'fallback' : quality_label;
            await this.dataSource.query(`INSERT INTO group_members (group_id, user_id, event_id, assignment_type, assigned_at)
         VALUES ($1,$2,$3,$4,NOW()) ON CONFLICT (group_id, user_id) DO NOTHING`, [groupId, m.user_id, eventId, assignmentType]);
            await this.dataSource.query(`INSERT INTO user_assignment_logs (event_id, user_id, group_id, assignment_type, assignment_reason)
         VALUES ($1,$2,$3,$4,$5)`, [eventId, m.user_id, groupId, assignmentType,
                group.fallback_used ? 'No optimal group found; fallback assignment.' : 'standard assignment']).catch(() => { });
        }
        return { group_id: groupId, size: members.length, quality_label, compatibility_score: Math.round(compatibility * 1000) / 1000, group_score, fallback_used: group.fallback_used || false };
    }
    async savePairScores(eventId, pairScores) {
        for (const [, ps] of pairScores) {
            await this.dataSource.query(`INSERT INTO pair_scores (event_id, user_a_id, user_b_id, compatibility_score, dimension_breakdown)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (event_id, user_a_id, user_b_id) DO UPDATE
           SET compatibility_score=EXCLUDED.compatibility_score, dimension_breakdown=EXCLUDED.dimension_breakdown, calculated_at=NOW()`, [eventId, ps.userA, ps.userB, ps.score, JSON.stringify(ps.breakdown)]).catch(() => { });
        }
    }
    async updateQueueStatus(eventId, userIds) {
        if (!userIds.length)
            return;
        await this.dataSource.query(`UPDATE match_queue SET status='matched', matched_at=NOW()
       WHERE event_id=$1 AND user_id=ANY($2)`, [eventId, userIds]);
    }
    // GET match-queue/status
    async getQueueStatus(eventId) {
        const rows = await this.dataSource.query(`SELECT
         COUNT(*) FILTER (WHERE status = 'waiting') AS total_waiting,
         COUNT(*) FILTER (WHERE status = 'matched') AS total_matched,
         COUNT(*)                                    AS total_users
       FROM match_queue WHERE event_id = $1`, [eventId]);
        const total = Number(rows[0].total_users);
        const waiting = Number(rows[0].total_waiting);
        const matched = Number(rows[0].total_matched);
        return {
            event_id: eventId,
            queue_status: waiting > 0 ? 'open' : 'closed',
            total_users: total,
            waiting_users: waiting,
            matched_users: matched,
            ready_for_matching: waiting >= 4,
            min_group_size: 4,
            max_group_size: 8,
        };
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        rgci_calculator_service_1.RgciCalculatorService])
], MatchingService);
