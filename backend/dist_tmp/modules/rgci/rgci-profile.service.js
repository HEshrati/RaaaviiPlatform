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
exports.RgciProfileService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const rgci_calculator_service_1 = require("./rgci-calculator.service");
const recommendation_service_1 = require("../recommendation/recommendation.service");
let RgciProfileService = class RgciProfileService {
    constructor(dataSource, calculator, recommendationService) {
        this.dataSource = dataSource;
        this.calculator = calculator;
        this.recommendationService = recommendationService;
    }
    async submitRgci(userId, answers, version = 'rgci_v1') {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            await qr.query(`INSERT INTO rgci_questionnaire_responses (user_id, questionnaire_version, answers)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, questionnaire_version)
         DO UPDATE SET answers = EXCLUDED.answers, submitted_at = NOW()`, [userId, version, JSON.stringify(answers)]);
            const result = this.calculator.calculate(answers);
            const { dimensions: d, outcomes: o, levels: l } = result;
            const profileRows = await qr.query(`INSERT INTO user_rgci_profiles (
          user_id, questionnaire_version,
          psychological_need_score, psychological_need_level,
          goal_score, goal_level,
          participation_score, participation_level,
          safety_score, safety_level,
          diversity_score, diversity_level,
          performance_score, performance_level,
          burnout_risk, wellbeing_score, wellbeing_level,
          satisfaction_score, satisfaction_level,
          generated_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
          questionnaire_version     = EXCLUDED.questionnaire_version,
          psychological_need_score  = EXCLUDED.psychological_need_score,
          psychological_need_level  = EXCLUDED.psychological_need_level,
          goal_score                = EXCLUDED.goal_score,
          goal_level                = EXCLUDED.goal_level,
          participation_score       = EXCLUDED.participation_score,
          participation_level       = EXCLUDED.participation_level,
          safety_score              = EXCLUDED.safety_score,
          safety_level              = EXCLUDED.safety_level,
          diversity_score           = EXCLUDED.diversity_score,
          diversity_level           = EXCLUDED.diversity_level,
          performance_score         = EXCLUDED.performance_score,
          performance_level         = EXCLUDED.performance_level,
          burnout_risk              = EXCLUDED.burnout_risk,
          wellbeing_score           = EXCLUDED.wellbeing_score,
          wellbeing_level           = EXCLUDED.wellbeing_level,
          satisfaction_score        = EXCLUDED.satisfaction_score,
          satisfaction_level        = EXCLUDED.satisfaction_level,
          updated_at                = NOW()
        RETURNING id`, [
                userId, version,
                d.psychological_need, l.psychological_need,
                d.goal, l.goal,
                d.participation, l.participation,
                d.safety, l.safety,
                d.diversity, l.diversity,
                o.performance, l.performance,
                o.burnout_risk,
                o.wellbeing, l.wellbeing,
                o.satisfaction, l.satisfaction,
            ]);
            const profileId = profileRows[0].id;
            await qr.commitTransaction();
            this.recommendationService
                .generateForUser(userId, result)
                .catch((err) => console.error('Recommendation generation failed:', err));
            return { profile_id: profileId, status: 'success' };
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async getProfile(userId) {
        const rows = await this.dataSource.query(`SELECT p.*,
        dn.title  AS pn_title,  dn.description AS pn_desc,
        dg.title  AS g_title,   dg.description AS g_desc,
        dp.title  AS par_title, dp.description AS par_desc,
        ds.title  AS s_title,   ds.description AS s_desc,
        dd.title  AS div_title, dd.description AS div_desc
       FROM user_rgci_profiles p
       LEFT JOIN rgci_dimension_descriptions dn
         ON dn.dimension = 'psychological_need' AND dn.level = p.psychological_need_level
       LEFT JOIN rgci_dimension_descriptions dg
         ON dg.dimension = 'goal' AND dg.level = p.goal_level
       LEFT JOIN rgci_dimension_descriptions dp
         ON dp.dimension = 'participation' AND dp.level = p.participation_level
       LEFT JOIN rgci_dimension_descriptions ds
         ON ds.dimension = 'safety' AND ds.level = p.safety_level
       LEFT JOIN rgci_dimension_descriptions dd
         ON dd.dimension = 'diversity' AND dd.level = p.diversity_level
       WHERE p.user_id = $1`, [userId]);
        if (!rows.length) {
            throw new common_1.NotFoundException('RGCI profile not found for this user');
        }
        const p = rows[0];
        return {
            user_id: userId,
            profile_id: p.id,
            questionnaire_version: p.questionnaire_version,
            dimensions: {
                psychological_need: {
                    score: Number(p.psychological_need_score),
                    level: p.psychological_need_level,
                    title: p.pn_title,
                    description: p.pn_desc,
                },
                goal: {
                    score: Number(p.goal_score),
                    level: p.goal_level,
                    title: p.g_title,
                    description: p.g_desc,
                },
                participation: {
                    score: Number(p.participation_score),
                    level: p.participation_level,
                    title: p.par_title,
                    description: p.par_desc,
                },
                safety: {
                    score: Number(p.safety_score),
                    level: p.safety_level,
                    title: p.s_title,
                    description: p.s_desc,
                },
                diversity: {
                    score: Number(p.diversity_score),
                    level: p.diversity_level,
                    title: p.div_title,
                    description: p.div_desc,
                },
            },
            outcome_indices: {
                performance: {
                    score: Number(p.performance_score),
                    level: p.performance_level,
                },
                wellbeing: {
                    score: Number(p.wellbeing_score),
                    level: p.wellbeing_level,
                    burnout_risk: Number(p.burnout_risk),
                    burnout_level: this.burnoutLevel(Number(p.burnout_risk)),
                },
                satisfaction_commitment: {
                    score: Number(p.satisfaction_score),
                    level: p.satisfaction_level,
                },
            },
            generated_at: p.generated_at,
            updated_at: p.updated_at,
        };
    }
    burnoutLevel(risk) {
        if (risk < 35)
            return 'low';
        if (risk < 65)
            return 'medium';
        return 'high';
    }
};
exports.RgciProfileService = RgciProfileService;
exports.RgciProfileService = RgciProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        rgci_calculator_service_1.RgciCalculatorService,
        recommendation_service_1.RecommendationService])
], RgciProfileService);
