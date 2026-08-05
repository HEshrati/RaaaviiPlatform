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
exports.RgciService = exports.RGCI_QUESTIONS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rgci_response_entity_1 = require("./entities/rgci-response.entity");
const relational_experience_quality_entity_1 = require("./entities/relational-experience-quality.entity");
const psychological_outcome_entity_1 = require("./entities/psychological-outcome.entity");
const article_recommendation_entity_1 = require("./entities/article-recommendation.entity");
// وزن‌های ۹ بُعد RGCI طبق پروپوزال
const RGCI_WEIGHTS = {
    dim_psychological_need: 0.18,
    dim_relational_goal: 0.14,
    dim_emotional_readiness: 0.13,
    dim_interaction_style: 0.11,
    dim_depth_disclosure: 0.15,
    dim_shared_experience: 0.12,
    dim_participation: 0.09,
    dim_psychological_safety: 0.14,
    dim_homogeneity_pref: 0.04,
};
// سوالات هر بُعد
exports.RGCI_QUESTIONS = {
    dim_psychological_need: [
        'در حال حاضر بیش از هر چیز به تجربه ارتباطی معنادار با دیگران نیاز دارم.',
        'یکی از نیازهای اصلی من از شرکت در رویداد، احساس تعلق بیشتر است.',
        'برای من مهم است در جمعی قرار بگیرم که بتوانم شنیده و فهمیده شوم.',
        'این روزها به یک فضای امن و کم‌فشار برای ارتباط با دیگران نیاز دارم.',
        'هدف من از حضور در جمع، کمتر احساس‌کردن تنهایی است.',
    ],
    dim_relational_goal: [
        'هدف اصلی من از شرکت در این رویداد، آشنایی با افراد جدید است.',
        'برای من مهم است که در این جمع گفتگویی عمیق‌تر از مکالمات روزمره تجربه کنم.',
        'بیشتر به دنبال یک تجربه اجتماعی سبک و کم‌فشار هستم.',
        'می‌خواهم در جمعی قرار بگیرم که امکان شکل‌گیری ارتباط ادامه‌دار وجود داشته باشد.',
        'هدف من از حضور، تجربه همراهی و کمتر احساس‌کردن تنهایی است.',
    ],
    dim_emotional_readiness: [
        'در حال حاضر از نظر روانی آمادگی شرکت در یک جمع کوچک را دارم.',
        'اگر در این رویداد با افراد جدید صحبت کنم، احتمالاً احساس راحتی نسبی خواهم داشت.',
        'این روزها از نظر هیجانی آن‌قدر خسته نیستم که ارتباط با دیگران برایم دشوار باشد.',
        'در یک جمع جدید معمولاً می‌توانم بعد از مدتی احساس راحتی بیشتری پیدا کنم.',
        'فکر می‌کنم بتوانم در یک گفتگوی گروهی بدون فشار زیاد مشارکت کنم.',
    ],
    dim_interaction_style: [
        'معمولاً در جمع‌ها از گفتگوهای گروهی لذت می‌برم.',
        'در تعاملات اجتماعی بیشتر شنونده هستم تا گوینده.',
        'ترجیح می‌دهم گفتگوها ساختار مشخصی داشته باشند.',
        'از تعاملات صمیمی و غیررسمی بیشتر از گفتگوهای رسمی لذت می‌برم.',
        'معمولاً در جمع‌ها راحت‌تر با شوخی و فضای سبک ارتباط می‌گیرم.',
    ],
    dim_depth_disclosure: [
        'در جمع‌های کوچک معمولاً دوست دارم گفتگوها کمی عمیق‌تر شوند.',
        'ترجیح می‌دهم در تعاملات اجتماعی فقط درباره موضوعات سطحی صحبت نکنیم.',
        'در یک جمع جدید راحت هستم اگر گفتگو کمی شخصی‌تر شود.',
        'معمولاً دوست دارم درباره تجربه‌های واقعی زندگی با دیگران صحبت کنم.',
        'از گفتگوهای تأملی و عمیق بیشتر از مکالمات کوتاه و سطحی لذت می‌برم.',
    ],
    dim_shared_experience: [
        'موضوع این رویداد به تجربه‌هایی در زندگی من نزدیک است.',
        'برخی از دغدغه‌های فعلی من مربوط به روابط انسانی است.',
        'در حال حاضر درباره مسیر زندگی یا آینده خود زیاد فکر می‌کنم.',
        'مایلم در جمعی باشم که افراد درباره تجربه‌های واقعی زندگی صحبت کنند.',
        'احساس می‌کنم گفتگو درباره تجربه‌های زندگی می‌تواند برایم مفید باشد.',
    ],
    dim_participation: [
        'در جمع‌های کوچک معمولاً تمایل دارم در گفتگو مشارکت کنم.',
        'از فعالیت‌های تعاملی در یک جمع لذت می‌برم.',
        'اگر فضای جمع مناسب باشد، معمولاً در گفتگوها مشارکت می‌کنم.',
        'دوست دارم در یک فعالیت گروهی نقش فعالی داشته باشم.',
        'در جمع‌های اجتماعی انرژی نسبتاً خوبی برای مشارکت دارم.',
    ],
    dim_psychological_safety: [
        'برای من مهم است در جمعی باشم که افراد با احترام به یکدیگر گوش دهند.',
        'در گفتگوهای گروهی رعایت مرزهای شخصی برایم اهمیت زیادی دارد.',
        'ترجیح می‌دهم در فضایی باشم که قضاوت کمتری وجود داشته باشد.',
        'احساس امنیت روانی در یک جمع برای من بسیار مهم است.',
        'در گفتگوها حساس هستم که افراد یکدیگر را قطع نکنند یا بی‌احترامی نکنند.',
    ],
    dim_homogeneity_pref: [
        'ترجیح می‌دهم در جمعی باشم که افراد تجربه‌های نسبتاً مشابهی با من دارند.',
        'از گفتگو با افرادی که دیدگاه‌های متفاوت دارند لذت می‌برم.',
        'برای من مهم است افراد گروه از نظر دغدغه‌های زندگی به من نزدیک باشند.',
        'تنوع دیدگاه‌ها در یک جمع می‌تواند برایم جذاب باشد.',
        'اگر افراد گروه خیلی با من متفاوت باشند، ارتباط گرفتن برایم سخت‌تر می‌شود.',
    ],
};
// نقشه نیاز روانشناختی غالب
const NEED_LABELS = {
    belonging: 'نیاز به تعلق',
    being_heard: 'نیاز به شنیده‌شدن',
    fun: 'نیاز به سبک‌شدن و تفریح',
    deep_talk: 'نیاز به گفتگوی عمیق',
    exit_isolation: 'نیاز به خروج از انزوا',
    support: 'نیاز به حمایت عاطفی',
    growth: 'نیاز به رشد فردی',
};
// پیشنهاد یخ‌شکن بر اساس نیاز غالب
const ICEBREAKER_BY_NEED = {
    belonging: 'بازی کشف شباهت‌ها — ما چه چیز مشترکی داریم؟',
    being_heard: 'کارت‌های روایت کوتاه — گوش‌دادن فعال',
    fun: 'بازی‌های طنز و چالش‌های سبک',
    deep_talk: 'سوال‌های تأملی — روایت تجربه‌های مهم زندگی',
    exit_isolation: 'فعالیت‌های تدریجی دونفره یا سه‌نفره',
    support: 'یخ‌شکن‌های امن و غیرقضاوتی',
    growth: 'سوال‌های خودشناسی و هدف‌گذاری کوچک',
};
// پیشنهاد مقاله بر اساس نیاز
const ARTICLE_TOPICS_BY_NEED = {
    belonging: ['احساس تعلق', 'پیوند اجتماعی', 'کیفیت روابط'],
    being_heard: ['ارتباط همدلانه', 'گوش‌دادن فعال', 'بیان هیجان'],
    exit_isolation: ['تنهایی', 'ارتباط اجتماعی', 'کاهش انزوا'],
    deep_talk: ['صمیمیت', 'خودافشایی', 'روابط معنادار'],
    fun: ['نشاط', 'تفریح سالم', 'تنظیم هیجان'],
    support: ['حمایت اجتماعی', 'امنیت روانی', 'تاب‌آوری'],
    growth: ['خودشناسی', 'رشد بین‌فردی', 'مهارت‌های ارتباطی'],
};
let RgciService = class RgciService {
    constructor(rgciRepo, reqRepo, outcomeRepo, articleRecRepo, dataSource) {
        this.rgciRepo = rgciRepo;
        this.reqRepo = reqRepo;
        this.outcomeRepo = outcomeRepo;
        this.articleRecRepo = articleRecRepo;
        this.dataSource = dataSource;
    }
    getQuestions() {
        return exports.RGCI_QUESTIONS;
    }
    // محاسبه نمره RGCI از پاسخ‌های خام
    calculateRgciScore(rawResponses) {
        const dimensions = {};
        for (const [dim, answers] of Object.entries(rawResponses)) {
            if (answers && answers.length > 0) {
                dimensions[dim] = answers.reduce((a, b) => a + b, 0) / answers.length;
            }
        }
        // نمره کل وزن‌دار
        let total = 0;
        for (const [dim, weight] of Object.entries(RGCI_WEIGHTS)) {
            total += (dimensions[dim] || 0) * weight;
        }
        // نیاز روانشناختی غالب از بُعد اول
        const needScore = dimensions['dim_psychological_need'] || 0;
        let dominantNeed = 'belonging';
        if (needScore >= 4.5)
            dominantNeed = 'exit_isolation';
        else if (needScore >= 4.0)
            dominantNeed = 'being_heard';
        else if (needScore >= 3.5)
            dominantNeed = 'belonging';
        else if (needScore >= 3.0)
            dominantNeed = 'deep_talk';
        else if (needScore >= 2.5)
            dominantNeed = 'fun';
        else
            dominantNeed = 'growth';
        return { dimensions, total: Math.round(total * 100) / 100, dominantNeed };
    }
    async submitRgci(userId, eventId, rawResponses) {
        const { dimensions, total, dominantNeed } = this.calculateRgciScore(rawResponses);
        const existing = await this.rgciRepo.findOne({
            where: { user_id: userId, ...(eventId ? { event_id: eventId } : {}) }
        });
        const data = {
            user_id: userId,
            event_id: eventId,
            dim_psychological_need: dimensions['dim_psychological_need'],
            dim_relational_goal: dimensions['dim_relational_goal'],
            dim_emotional_readiness: dimensions['dim_emotional_readiness'],
            dim_interaction_style: dimensions['dim_interaction_style'],
            dim_depth_disclosure: dimensions['dim_depth_disclosure'],
            dim_shared_experience: dimensions['dim_shared_experience'],
            dim_participation: dimensions['dim_participation'],
            dim_psychological_safety: dimensions['dim_psychological_safety'],
            dim_homogeneity_pref: dimensions['dim_homogeneity_pref'],
            rgci_total_score: total,
            dominant_psychological_need: dominantNeed,
            raw_responses: rawResponses,
        };
        if (existing) {
            await this.rgciRepo.update(existing.id, data);
            return { ...existing, ...data };
        }
        const record = this.rgciRepo.create(data);
        return this.rgciRepo.save(record);
    }
    async getMyRgci(userId, eventId) {
        return this.rgciRepo.findOne({
            where: { user_id: userId, ...(eventId ? { event_id: eventId } : {}) },
            order: { created_at: 'DESC' },
        });
    }
    async submitPostEventSurvey(userId, eventId, groupId, rawResponses) {
        const dims = [
            'psychological_safety', 'felt_heard', 'felt_accepted',
            'conversation_quality', 'interaction_meaning', 'participation_comfort',
            'felt_connected', 'group_satisfaction', 'continued_interest'
        ];
        let total = 0;
        const data = { user_id: userId, event_id: eventId, group_id: groupId, raw_responses: rawResponses };
        for (const d of dims) {
            data[d] = rawResponses[d] || null;
            total += rawResponses[d] || 0;
        }
        data.total_score = Math.round((total / dims.length) * 100) / 100;
        const existing = await this.reqRepo.findOne({ where: { user_id: userId, event_id: eventId } });
        if (existing) {
            await this.reqRepo.update(existing.id, data);
            return { ...existing, ...data };
        }
        return this.reqRepo.save(this.reqRepo.create(data));
    }
    async submitOutcome(userId, eventId, stage, responses) {
        const data = {
            user_id: userId,
            event_id: eventId,
            stage,
            belonging_score: responses['belonging'] || null,
            loneliness_score: responses['loneliness'] || null,
            social_vitality: responses['vitality'] || null,
            wellbeing_score: responses['wellbeing'] || null,
            raw_responses: responses,
        };
        const existing = await this.outcomeRepo.findOne({
            where: { user_id: userId, ...(eventId ? { event_id: eventId } : {}), stage }
        });
        if (existing) {
            await this.outcomeRepo.update(existing.id, data);
            return { ...existing, ...data };
        }
        return this.outcomeRepo.save(this.outcomeRepo.create(data));
    }
    async getArticleRecommendations(userId) {
        // پیدا کن نیاز غالب کاربر
        const rgci = await this.rgciRepo.findOne({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });
        const need = rgci?.dominant_psychological_need || 'belonging';
        const topics = ARTICLE_TOPICS_BY_NEED[need] || ARTICLE_TOPICS_BY_NEED['belonging'];
        // مقالات مرتبط رو از دیتابیس بگیر
        const articles = await this.dataSource.query(`
      SELECT id, title, summary, category, image_url, slug
      FROM ai_content
      WHERE status = 'published'
      AND (
        ${topics.map((_, i) => `title ILIKE $${i + 1}`).join(' OR ')}
      )
      LIMIT 6
    `, topics.map(t => `%${t}%`));
        // اگه کم بود از articles هم بگیر
        if (articles.length < 3) {
            const more = await this.dataSource.query(`
        SELECT id, title, summary, category, image_url, slug
        FROM articles
        WHERE is_published = true
        AND category IN (${topics.map((_, i) => `$${i + 1}`).join(',')})
        LIMIT 6
      `, topics);
            articles.push(...more);
        }
        return {
            need,
            need_label: NEED_LABELS[need] || need,
            icebreaker_suggestion: ICEBREAKER_BY_NEED[need],
            articles: articles.slice(0, 6),
        };
    }
    async getIcebreakerForGroup(dominantNeed) {
        return {
            need: dominantNeed,
            need_label: NEED_LABELS[dominantNeed] || dominantNeed,
            suggestion: ICEBREAKER_BY_NEED[dominantNeed] || ICEBREAKER_BY_NEED['belonging'],
            article_topics: ARTICLE_TOPICS_BY_NEED[dominantNeed] || [],
        };
    }
    async getMyStats(userId) {
        const rgci = await this.rgciRepo.findOne({ where: { user_id: userId }, order: { created_at: 'DESC' } });
        const outcomes = await this.outcomeRepo.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
        const surveys = await this.reqRepo.find({ where: { user_id: userId }, order: { created_at: 'DESC' } });
        return { rgci, outcomes, surveys };
    }
    // پروفایل کامل با فرمت استاندارد PDF بخش ۴.۴.۱
    async getFullRgciProfile(userId) {
        const rows = await this.dataSource
            ? this.dataSource.query(`SELECT * FROM user_rgci_profiles WHERE user_id = $1`, [userId]).catch(() => [])
            : [];
        // اگر dataSource نداشت از repo بخون
        const profile = rows[0] || await this.profileRepo?.findOne({ where: { user_id: userId } });
        if (!profile)
            return { error: 'پروفایل RGCI یافت نشد.' };
        const level = (score) => {
            if (score === null || score === undefined)
                return 'unknown';
            if (score >= 70)
                return 'high';
            if (score >= 40)
                return 'mid';
            return 'low';
        };
        return {
            user_id: userId,
            profile_id: profile.id,
            questionnaire_version: profile.questionnaire_version || 'rgci_v1',
            dimensions: {
                psychological_need: {
                    score: Number(profile.psychological_need_score),
                    level: profile.psychological_need_level || level(Number(profile.psychological_need_score)),
                },
                goal: {
                    score: Number(profile.goal_score),
                    level: profile.goal_level || level(Number(profile.goal_score)),
                },
                participation: {
                    score: Number(profile.participation_score),
                    level: profile.participation_level || level(Number(profile.participation_score)),
                },
                safety: {
                    score: Number(profile.safety_score),
                    level: profile.safety_level || level(Number(profile.safety_score)),
                },
                diversity: {
                    score: Number(profile.diversity_score),
                    level: profile.diversity_level || level(Number(profile.diversity_score)),
                },
            },
            outcome_indices: {
                performance: {
                    score: Number(profile.performance_score),
                    level: profile.performance_level || level(Number(profile.performance_score)),
                },
                wellbeing: {
                    score: Number(profile.wellbeing_score),
                    level: profile.wellbeing_level || level(Number(profile.wellbeing_score)),
                    burnout_risk: Number(profile.burnout_risk) >= 0.6 ? 'high'
                        : Number(profile.burnout_risk) >= 0.35 ? 'medium' : 'low',
                },
                satisfaction_commitment: {
                    score: Number(profile.satisfaction_score),
                    level: profile.satisfaction_level || level(Number(profile.satisfaction_score)),
                },
            },
            generated_at: profile.generated_at || profile.updated_at,
        };
    }
};
exports.RgciService = RgciService;
exports.RgciService = RgciService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rgci_response_entity_1.RgciResponse)),
    __param(1, (0, typeorm_1.InjectRepository)(relational_experience_quality_entity_1.RelationalExperienceQuality)),
    __param(2, (0, typeorm_1.InjectRepository)(psychological_outcome_entity_1.PsychologicalOutcome)),
    __param(3, (0, typeorm_1.InjectRepository)(article_recommendation_entity_1.ArticleRecommendation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], RgciService);
