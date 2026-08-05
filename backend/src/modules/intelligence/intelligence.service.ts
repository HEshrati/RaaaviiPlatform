/**
 * ============================================================
 *  UserIntelligenceService — سرویس هوش کاربری راوی
 *  یکپارچه‌سازی تمام نتایج تست → پروفایل هوشمند
 * ============================================================
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { derivedMainResult, normalizeTestScores, smartProfileProjection } from '../test-results/test-score-normalizer';

// ── فازبندی تست‌ها ─────────────────────────────────
export const TEST_PHASES = {
  1: {
    label: 'شناخت پایه',
    tests: ['raavi_matching_basis_v1','neo_ffi','ecr_r','erq','iri'],
    unlockCondition: 0,
    description: 'پایه شخصیت‌شناسی',
  },
  2: {
    label: 'عمق رابطه',
    tests: ['gottman','love_languages','conflict_style','phq9','gad7'],
    unlockCondition: 3, // حداقل ۳ تست فاز ۱
    description: 'الگوهای رابطه‌ای',
  },
  3: {
    label: 'پروفایل تخصصی',
    tests: ['hexaco','dass21','bai','isi','asrs','sexual_compat','mdq','ybocs','pcl5','bdi2','pid5','ysq','mmpi_screen','mcmi_screen'],
    unlockCondition: 5, // کل فاز ۲
    description: 'بررسی عمیق و تخصصی',
  },
};

// ── نگاشت تست → کتگوری مقاله ──────────────────────
const TEST_ARTICLE_CATS: Record<string, string[]> = {
  raavi_matching_basis_v1: ['خودشناسی','رشد فردی'],
  neo_ffi:    ['رشد فردی','خودشناسی'],
  ecr_r:      ['روابط سالم','بهداشت روان'],
  erq:        ['هوش هیجانی','مدیریت استرس'],
  iri:        ['هوش هیجانی','روابط سالم'],
  gottman:    ['روابط سالم'],
  love_languages: ['روابط سالم'],
  conflict_style: ['روابط سالم','هوش هیجانی'],
  phq9:       ['بهداشت روان','روانشناسی مثبت'],
  gad7:       ['مدیریت استرس','بهداشت روان'],
  hexaco:     ['خودشناسی'],
  dass21:     ['بهداشت روان','مدیریت استرس'],
  bai:        ['مدیریت استرس'],
  isi:        ['بهداشت روان'],
};

// ── نگاشت نتایج تست → نوع ایونت ──────────────────
const TEST_EVENT_TYPES: Record<string, Record<string, string[]>> = {
  raavi_matching_basis_v1: {
    ISTJ: ['گفتگو','آموزش'],
    ISFJ: ['دورهمی','آشپزی'],
    INFJ: ['هنر','گفتگو'],
    INTJ: ['آموزش','فناوری'],
    ISTP: ['ورزش','طبیعت'],
    ISFP: ['هنر','طبیعت'],
    INFP: ['هنر','موسیقی'],
    INTP: ['آموزش','بازی'],
    ESTP: ['ورزش','ماجراجویی'],
    ESFP: ['موسیقی','دورهمی'],
    ENFP: ['هنر','ماجراجویی'],
    ENTP: ['گفتگو','فناوری'],
    ESTJ: ['آموزش','گفتگو'],
    ESFJ: ['دورهمی','آشپزی'],
    ENFJ: ['هنر','گفتگو'],
    ENTJ: ['آموزش','رهبری'],
  },
  ecr_r: {
    secure:      ['گفتگو','دورهمی','هنر'],
    anxious:     ['مدیتیشن','یوگا','آموزش'],
    avoidant:    ['ورزش','طبیعت','آموزش'],
    disorganized:['مدیتیشن','گفتگو'],
  },
};

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ══════════════════════════════════════════
  //  CRON: هر ۱۵ دقیقه sync کامل
  // ══════════════════════════════════════════
  @Cron('*/15 * * * *')
  async cronSyncAll(): Promise<void> {
    try {
      const users = await this.ds.query('SELECT DISTINCT user_id FROM test_results');
      for (const { user_id } of users) {
        await this.fullSync(user_id).catch(() => {});
      }
    } catch {}
  }

  // ══════════════════════════════════════════
  //  sync کامل یک کاربر
  // ══════════════════════════════════════════
  async fullSync(userId: string): Promise<void> {
    const rows = await this.ds.query(`
      SELECT DISTINCT ON (test_name) test_name, scores, main_result, completed_at
      FROM test_results WHERE user_id=$1
      ORDER BY test_name, completed_at DESC
    `, [userId]);
    // Use the same canonical calculation as new submissions. This also repairs
    // smart-profile projections for valid historical responses on the next sync.
    const results = rows.map((row: any) => {
      const scores = normalizeTestScores(row.test_name, row.scores);
      return { ...row, scores, main_result: derivedMainResult(row.test_name, scores, row.main_result || 'completed') };
    });

    const projection = results.reduce((all: Record<string, any>, row: any) => (
      { ...all, ...smartProfileProjection(row.test_name, row.scores) }
    ), {});
    const projectionKeys = Object.keys(projection).filter(key => projection[key] !== undefined);
    if (projectionKeys.length) {
      await this.ds.query('INSERT INTO smart_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
      await this.ds.query(
        `UPDATE smart_profiles SET ${projectionKeys.map((key, i) => `${key}=$${i + 2}`).join(', ')}, last_test_sync=NOW() WHERE user_id=$1`,
        [userId, ...projectionKeys.map(key => projection[key])],
      );
    }

    // ── بررسی فازها ──────────────────────────
    const doneTests = results.map((r: any) => r.test_name);
    const phase1Done = TEST_PHASES[1].tests.filter(t => doneTests.includes(t)).length;
    const phase2Done = TEST_PHASES[2].tests.filter(t => doneTests.includes(t)).length;
    const phase3Done = TEST_PHASES[3].tests.filter(t => doneTests.includes(t)).length;

    const phase1Complete = phase1Done >= TEST_PHASES[1].tests.length;
    const phase2Complete = phase2Done >= TEST_PHASES[2].tests.length;
    const profileCompleteness = Math.round(
      (phase1Done * 8 + phase2Done * 5 + phase3Done * 2) / 65 * 100
    );

    // ── محاسبه کتگوری‌های مقاله پیشنهادی ──
    const artCats = new Set<string>();
    for (const r of results) {
      const cats = TEST_ARTICLE_CATS[r.test_name] || [];
      cats.forEach((c: string) => artCats.add(c));
      // بر اساس نتیجه تست
      const scores = typeof r.scores === 'string' ? JSON.parse(r.scores) : r.scores || {};
      if (r.test_name === 'neo_ffi') {
        if ((scores.N || 0) > 18) { artCats.add('مدیریت استرس'); artCats.add('بهداشت روان'); }
        if ((scores.A || 0) < 14) artCats.add('روابط سالم');
        if ((scores.O || 0) > 20) artCats.add('رشد فردی');
      }
      if (r.test_name === 'ecr_r') {
        if ((scores.ANX || 0) > 38) artCats.add('مدیریت استرس');
        if ((scores.AVO || 0) > 38) artCats.add('روابط سالم');
        if ((scores.ANX || 0) <= 27 && (scores.AVO || 0) <= 27) artCats.add('روانشناسی مثبت');
      }
      if (r.test_name === 'phq9' || r.test_name === 'gad7' || r.test_name === 'dass21') {
        artCats.add('بهداشت روان'); artCats.add('روانشناسی مثبت');
      }
    }

    // ── محاسبه نوع ایونت پیشنهادی ───────────
    const evTypes = new Set<string>();
    for (const r of results) {
      const typeMap = TEST_EVENT_TYPES[r.test_name];
      if (typeMap) {
        const mainResult = (r.main_result || '').split(' ')[0];
        const types = typeMap[mainResult] || typeMap.default || [];
        types.forEach((t: string) => evTypes.add(t));
      }
    }
    // فال‌بک
    if (evTypes.size === 0) ['دورهمی','گفتگو','هنر'].forEach(t => evTypes.add(t));

    // ── آپدیت smart_profiles ─────────────────
    await this.ds.query(`
      INSERT INTO smart_profiles (user_id, phase1_complete, phase2_complete, phase3_count,
        total_tests_done, profile_completeness, recommended_article_cats,
        recommended_event_types, last_recommendation_check)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        phase1_complete=$2, phase2_complete=$3, phase3_count=$4,
        total_tests_done=$5, profile_completeness=$6,
        recommended_article_cats=$7, recommended_event_types=$8,
        last_recommendation_check=NOW()
    `, [userId, phase1Complete, phase2Complete, phase3Done,
        results.length, profileCompleteness,
        [...artCats], [...evTypes]]);

    // ── ذخیره user_test_progress ─────────────
    for (const r of results) {
      const phase = Object.entries(TEST_PHASES).find(([,p]) =>
        p.tests.includes(r.test_name)
      )?.[0] || '3';
      await this.ds.query(`
        INSERT INTO user_test_progress(user_id,test_id,phase,completed,score,main_result,completed_at)
        VALUES($1,$2,$3,true,$4,$5,$6)
        ON CONFLICT(user_id,test_id) DO UPDATE SET
          completed=true, score=$4, main_result=$5, completed_at=$6
      `, [userId, r.test_name, parseInt(phase),
          JSON.stringify(r.scores || {}), r.main_result, r.completed_at]);
    }

    // ── validation ───────────────────────────
    await this.validateRecommendations(userId, [...artCats], [...evTypes]);
  }

  // ══════════════════════════════════════════
  //  validation — بررسی صحت پیشنهادات
  // ══════════════════════════════════════════
  async validateRecommendations(userId: string, artCats: string[], evTypes: string[]): Promise<void> {
    const issues: string[] = [];

    // چک مقالات
    const articles = await this.ds.query(`
      SELECT category, COUNT(*) FROM articles
      WHERE category = ANY($1) AND is_published=true GROUP BY category
    `, [artCats]);

    const artOk = articles.length > 0;
    if (!artOk) issues.push(`مقاله‌ای برای کتگوری‌های ${artCats.join(',')} پیدا نشد`);

    // چک ایونت‌ها
    const events = await this.ds.query(`SELECT COUNT(*) as c FROM events WHERE start_date > NOW()`);
    const evOk = parseInt(events[0]?.c || '0') > 0;
    if (!evOk) issues.push('ایونت فعال موجود نیست');

    await this.ds.query(`
      INSERT INTO recommendation_validations(user_id,articles_ok,events_ok,issues,stats)
      VALUES($1,$2,$3,$4,$5)
    `, [userId, artOk, evOk, JSON.stringify(issues),
        JSON.stringify({artCats, evTypes, checkedAt: new Date()})]);
  }

  // ══════════════════════════════════════════
  //  دریافت پروفایل کامل کاربر
  // ══════════════════════════════════════════
  async getFullProfile(userId: string): Promise<any> {
    await this.fullSync(userId).catch(() => {});

    const [sp, progress, tests] = await Promise.all([
      this.ds.query('SELECT * FROM smart_profiles WHERE user_id=$1 LIMIT 1', [userId]),
      this.ds.query('SELECT * FROM user_test_progress WHERE user_id=$1 ORDER BY phase,test_id', [userId]),
      this.ds.query(`
        SELECT DISTINCT ON(test_name) test_name,main_result,scores,completed_at
        FROM test_results WHERE user_id=$1 ORDER BY test_name,completed_at DESC
      `, [userId]),
    ]);

    const profile = sp[0] || {};
    const doneIds = progress.map((p: any) => p.test_id);

    // وضعیت هر فاز
    const phases = Object.entries(TEST_PHASES).map(([num, ph]) => ({
      phase: parseInt(num),
      label: ph.label,
      description: ph.description,
      total: ph.tests.length,
      done: ph.tests.filter(t => doneIds.includes(t)).length,
      tests: ph.tests.map(t => ({
        id: t,
        done: doneIds.includes(t),
        result: tests.find((r: any) => r.test_name === t)?.main_result || null,
        unlockedAt: progress.find((p: any) => p.test_id === t)?.unlocked_at || null,
      })),
      unlocked: parseInt(num) === 1 ? true :
        parseInt(num) === 2 ? (profile.phase1_complete || false) :
        (profile.phase2_complete || false),
    }));

    return {
      userId,
      phases,
      profileCompleteness: profile.profile_completeness || 0,
      phase1Complete: profile.phase1_complete || false,
      phase2Complete: profile.phase2_complete || false,
      phase3Count: profile.phase3_count || 0,
      no_show_count: profile.no_show_count || 0,
      is_suspended: profile.is_suspended || false,
      totalTestsDone: tests.length,
      recommendedArticleCats: profile.recommended_article_cats || [],
      recommendedEventTypes: profile.recommended_event_types || [],
      smartScore: profile.smart_score || 0,
      mentalHealthScore: profile.mental_health_score || 0,
      relationshipReadiness: profile.relationship_readiness || 0,
      mbti: profile.mbti_type,
      attachmentStyle: profile.attachment_style,
      neo: profile.neo_e ? {E:profile.neo_e,A:profile.neo_a,C:profile.neo_c,N:profile.neo_n,O:profile.neo_o} : null,
      ecr: profile.ecr_anxiety ? {anxiety:profile.ecr_anxiety,avoidance:profile.ecr_avoidance} : null,
      lastSync: profile.last_test_sync,
    };
  }

  // ══════════════════════════════════════════
  //  پیشنهاد مقالات برای کاربر
  // ══════════════════════════════════════════
  async getArticleRecommendations(userId: string, limit=10): Promise<any[]> {
    const sp = await this.ds.query(
      'SELECT recommended_article_cats FROM smart_profiles WHERE user_id=$1', [userId]
    );
    const cats = sp[0]?.recommended_article_cats || ['رشد فردی','روابط سالم'];

    return this.ds.query(`
      SELECT id,title,summary,category,image_url,read_time,created_at
      FROM articles
      WHERE category = ANY($1) AND is_published=true
      ORDER BY view_count DESC, created_at DESC
      LIMIT $2
    `, [cats, limit]);
  }

  // ══════════════════════════════════════════
  //  پیشنهاد ایونت برای کاربر
  // ══════════════════════════════════════════
  async getEventRecommendations(userId: string, limit=6): Promise<any[]> {
    const sp = await this.ds.query(
      'SELECT recommended_event_types,extroversion_score,location_preference FROM smart_profiles WHERE user_id=$1',
      [userId]
    );
    const evTypes = sp[0]?.recommended_event_types || [];
    const extro = sp[0]?.extroversion_score || 50;

    const events = await this.ds.query(`
      SELECT *,
        CASE WHEN $1::text[] && ARRAY[tags]::text[] THEN 20 ELSE 0 END as type_match
      FROM events WHERE start_date > NOW()
      ORDER BY type_match DESC, start_date ASC
      LIMIT $2
    `, [evTypes, limit]).catch(() =>
      this.ds.query('SELECT * FROM events WHERE start_date>NOW() ORDER BY start_date LIMIT $1', [limit])
    );

    return events.map((ev: any) => ({
      ...ev,
      matchScore: 50 + (ev.type_match || 0) +
        (extro > 60 && (ev.capacity || 0) > 5 ? 10 : 0),
    }));
  }

  // ══════════════════════════════════════════
  //  تست‌های پیشنهادی بعدی
  // ══════════════════════════════════════════
  async getNextRecommendedTests(userId: string): Promise<any[]> {
    const profile = await this.getFullProfile(userId);
    const doneIds = profile.phases.flatMap((p: any) => p.tests.filter((t: any) => t.done).map((t: any) => t.id));

    const recs: any[] = [];
    for (const phase of profile.phases) {
      if (!phase.unlocked) continue;
      const pending = phase.tests.filter((t: any) => !t.done);
      recs.push(...pending.map((t: any) => ({
        testId: t.id,
        phase: phase.phase,
        phaseLabel: phase.label,
        priority: phase.phase === 1 ? 'اجباری' : phase.phase === 2 ? 'پیشنهادی' : 'اختیاری',
      })));
    }
    return recs.slice(0, 5);
  }
}
