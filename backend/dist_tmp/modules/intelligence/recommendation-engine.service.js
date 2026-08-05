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
var RecommendationEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationEngineService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
/**
 * ══════════════════════════════════════════════════════════════
 *  RecommendationEngine — موتور پیشنهاد هوشمند راوی
 *  هر بار محتوا اضافه شد → فوری به کاربران مرتبط پیشنهاد بده
 * ══════════════════════════════════════════════════════════════
 */
// ── map: دسته‌بندی → تست‌های مرتبط ───────────────────────
const CAT_TEST_MAP = {
    'روابط سالم': ['ecr_r', 'gottman', 'love_languages', 'conflict_style'],
    'هوش هیجانی': ['erq', 'iri'],
    'بهداشت روان': ['phq9', 'gad7', 'dass21', 'bai', 'isi', 'asrs', 'bdi2', 'pcl5'],
    'رشد فردی': ['neo_ffi'],
    'مدیریت استرس': ['gad7', 'dass21', 'erq'],
    'ذهن‌آگاهی': ['erq', 'iri'],
    'روانشناسی مثبت': ['neo_ffi', 'phq9'],
    'خودشناسی': ['neo_ffi', 'hexaco', 'ysq', 'pid5'],
    // ایونت‌های قدیمی
    'hamneshin': ['ecr_r', 'iri', 'erq', 'raavi_matching_basis_v1', 'neo_ffi'],
    'همنشینی': ['ecr_r', 'iri', 'erq', 'raavi_matching_basis_v1'],
    'مشاوره': ['phq9', 'gad7', 'ecr_r'],
    'جلسه': ['ecr_r', 'neo_ffi'],
};
const EVENT_TYPE_EXTRA = {
    'social': ['raavi_matching_basis_v1', 'neo_ffi', 'ecr_r'],
    'group': ['ecr_r', 'iri', 'erq'],
    'individual': ['phq9', 'gad7', 'ecr_r'],
    'online': ['phq9', 'gad7', 'erq'],
};
// ── map: نوع ایونت → تست مرتبط ───────────────────────────
const EVENT_TYPE_MAP = {
    'کارگاه': ['neo_ffi', 'ecr_r', 'erq', 'iri'],
    'گروه‌درمانی': ['phq9', 'gad7', 'ecr_r'],
    'دورهمی': ['neo_ffi', 'raavi_matching_basis_v1'],
    'آنلاین': ['phq9', 'gad7', 'dass21', 'isi', 'asrs'],
    'زوج‌درمانی': ['gottman', 'ecr_r', 'love_languages'],
};
// ── آستانه‌های نتیجه تست برای پیشنهاد ────────────────────
function shouldRecommend(testName, scores, forEvent = true) {
    // برای ایونت‌ها — همه که تست دادن پیشنهاد بگیرن
    if (forEvent)
        return true;
    // برای مقالات — فقط نتایج مرتبط
    const s = typeof scores === 'string' ? JSON.parse(scores) : scores || {};
    switch (testName) {
        case 'phq9': return Number(s.total ?? 0) >= 5;
        case 'gad7': return Number(s.total ?? 0) >= 5;
        case 'dass21': return Number(s.D ?? 0) >= 7 || Number(s.A ?? 0) >= 7 || Number(s.S ?? 0) >= 7;
        case 'ecr_r': return Number(s.ANX ?? 0) > 28 || Number(s.AVO ?? 0) > 28;
        case 'erq': return Number(s.ES ?? 0) > 14 || Number(s.CR ?? 0) < 18;
        case 'neo_ffi': return true;
        case 'iri': return Number(s.EC ?? 0) < 22 || Number(s.PT ?? 0) < 22;
        case 'gottman': return Object.values(s).reduce((a, b) => a + (Number(b) || 0), 0) > 15;
        default: return true;
    }
}
let RecommendationEngineService = RecommendationEngineService_1 = class RecommendationEngineService {
    constructor(ds) {
        this.ds = ds;
        this.logger = new common_1.Logger(RecommendationEngineService_1.name);
    }
    async onApplicationBootstrap() {
        try {
            await this.ds.query(`
        CREATE TABLE IF NOT EXISTS smart_recommendations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          type VARCHAR(30) NOT NULL,
          item_id VARCHAR(200) NOT NULL,
          score FLOAT DEFAULT 0,
          reasons JSONB DEFAULT '[]',
          is_clicked BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, type, item_id)
        )
      `);
            await this.ds.query(`CREATE INDEX IF NOT EXISTS idx_smart_rec_user ON smart_recommendations(user_id)`);
            this.logger.log('✅ smart_recommendations table ready');
        }
        catch (e) {
            this.logger.error('Table init error: ' + e.message);
        }
    }
    // ── فوری بعد از اضافه شدن ایونت ─────────────────────────
    async onNewEvent(eventId) {
        this.logger.log(`🎯 New event → matching users: ${eventId}`);
        try {
            const [event] = await this.ds.query(`SELECT * FROM events WHERE id=$1`, [eventId]);
            if (!event)
                return;
            const relatedTests = [
                ...(CAT_TEST_MAP[event.category] || []),
                ...(EVENT_TYPE_MAP[event.event_type] || []),
                ...((event.tags || []).flatMap((t) => CAT_TEST_MAP[t] || [])),
                ...(EVENT_TYPE_EXTRA?.[event.event_type] || []),
                // اگه هیچی match نشد — همه کاربران با هر تست
                ...((CAT_TEST_MAP[event.category] || []).length === 0 &&
                    (EVENT_TYPE_MAP[event.event_type] || []).length === 0
                    ? ['neo_ffi', 'ecr_r', 'raavi_matching_basis_v1', 'erq', 'iri'] : []),
            ];
            const uniqueTests = [...new Set(relatedTests)];
            if (!uniqueTests.length)
                return;
            // پیدا کردن کاربران مرتبط
            const users = await this.ds.query(`
        SELECT DISTINCT ON (user_id) user_id, test_name, scores, main_result
        FROM test_results
        WHERE test_name = ANY($1)
        ORDER BY user_id, completed_at DESC
      `, [uniqueTests]);
            this.logger.log(`found ${users.length} users for tests: ${uniqueTests.join(',')}`);
            let count = 0;
            for (const u of users) {
                const rec = shouldRecommend(u.test_name, u.scores);
                this.logger.log(`user ${u.user_id?.slice(0, 8)} test ${u.test_name}: shouldRec=${rec}`);
                if (!rec)
                    continue;
                const score = this.calcEventScore(event, u.test_name, u.scores);
                await this.ds.query(`
          INSERT INTO smart_recommendations(user_id, type, item_id, score, reasons, created_at)
          VALUES($1,'event',$2,$3,$4,NOW())
          ON CONFLICT DO NOTHING
        `, [u.user_id, eventId, score,
                    JSON.stringify([`تناسب با تست ${u.test_name}`])]);
                count++;
            }
            this.logger.log(`✅ event ${eventId}: ${count} کاربر هدف`);
        }
        catch (e) {
            this.logger.error(`event match error: ${e.message}`);
        }
    }
    // ── فوری بعد از اضافه شدن مقاله ─────────────────────────
    async onNewArticle(articleId) {
        this.logger.log(`📚 New article → matching users: ${articleId}`);
        try {
            const [article] = await this.ds.query(`SELECT * FROM articles WHERE id=$1`, [articleId]);
            if (!article)
                return;
            const relatedTests = CAT_TEST_MAP[article.category] || ['neo_ffi'];
            const users = await this.ds.query(`
        SELECT DISTINCT ON (user_id) user_id, test_name, scores
        FROM test_results WHERE test_name = ANY($1)
        ORDER BY user_id, completed_at DESC
      `, [relatedTests]);
            let count = 0;
            for (const u of users) {
                if (!shouldRecommend(u.test_name, u.scores, false))
                    continue;
                const score = this.calcArticleScore(article, u.test_name, u.scores);
                await this.ds.query(`
          INSERT INTO smart_recommendations(user_id, type, item_id, score, reasons, created_at)
          VALUES($1,'article',$2,$3,$4,NOW())
          ON CONFLICT DO NOTHING
        `, [u.user_id, String(articleId), score,
                    JSON.stringify([`دسته ${article.category} با تست ${u.test_name}`])]);
                count++;
            }
            this.logger.log(`✅ article ${articleId}: ${count} کاربر هدف`);
        }
        catch (e) {
            this.logger.error(`article match error: ${e.message}`);
        }
    }
    // ── sync کامل همه کاربران با همه محتوا ──────────────────
    async fullRecommendationSync() {
        this.logger.log('🔄 Full recommendation sync...');
        try {
            // ایونت‌های اخیر
            const events = await this.ds.query(`SELECT id FROM events WHERE is_active=true AND start_date > NOW() ORDER BY created_at DESC LIMIT 20`);
            for (const ev of events)
                await this.onNewEvent(ev.id);
            // مقالات اخیر
            const articles = await this.ds.query(`SELECT id FROM articles WHERE is_published=true ORDER BY created_at DESC LIMIT 30`);
            for (const a of articles)
                await this.onNewArticle(a.id);
            this.logger.log('✅ Full sync complete');
        }
        catch (e) {
            this.logger.error(`full sync error: ${e.message}`);
        }
    }
    // ── پیشنهادات کاربر ──────────────────────────────────────
    async getUserRecommendations(userId) {
        const recs = await this.ds.query(`
      SELECT sr.type, sr.item_id, sr.score, sr.reasons
      FROM smart_recommendations sr
      WHERE sr.user_id=$1
      ORDER BY sr.score DESC, sr.created_at DESC
    `, [userId]);
        const eventIds = recs.filter((r) => r.type === 'event').map((r) => r.item_id);
        const articleIds = recs.filter((r) => r.type === 'article').map((r) => r.item_id);
        const [events, articles] = await Promise.all([
            eventIds.length ? this.ds.query(`SELECT * FROM events WHERE id = ANY($1) AND is_active=true AND start_date > NOW()`, [eventIds]) : [],
            articleIds.length ? this.ds.query(`SELECT id,title,category,author,summary,read_time,image_url FROM articles WHERE id::text = ANY($1) AND is_published=true`, [articleIds]) : [],
        ]);
        return { events, articles, therapists: [] };
    }
    calcEventScore(event, testName, scores) {
        let score = 0.5;
        const s = typeof scores === 'string' ? JSON.parse(scores) : scores || {};
        if (CAT_TEST_MAP[event.category]?.includes(testName))
            score += 0.3;
        if (EVENT_TYPE_MAP[event.event_type]?.includes(testName))
            score += 0.2;
        if (shouldRecommend(testName, s))
            score += 0.1;
        return Math.min(1, score);
    }
    calcArticleScore(article, testName, scores) {
        let score = 0.4;
        if (CAT_TEST_MAP[article.category]?.includes(testName))
            score += 0.4;
        if (shouldRecommend(testName, scores))
            score += 0.2;
        return Math.min(1, score);
    }
};
exports.RecommendationEngineService = RecommendationEngineService;
__decorate([
    (0, schedule_1.Cron)('0 */6 * * *') // هر ۶ ساعت
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecommendationEngineService.prototype, "fullRecommendationSync", null);
exports.RecommendationEngineService = RecommendationEngineService = RecommendationEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], RecommendationEngineService);
