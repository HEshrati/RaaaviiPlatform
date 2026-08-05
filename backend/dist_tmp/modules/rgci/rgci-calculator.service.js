"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RgciCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const DIMENSION_MAP = {
    q_001: { dimension: 'psychological_need', weight: 1 },
    q_002: { dimension: 'psychological_need', weight: 1 },
    q_003: { dimension: 'psychological_need', weight: 1 },
    q_004: { dimension: 'psychological_need', weight: -1 },
    q_005: { dimension: 'psychological_need', weight: 1 },
    q_006: { dimension: 'psychological_need', weight: 1 },
    q_007: { dimension: 'psychological_need', weight: 1 },
    q_008: { dimension: 'psychological_need', weight: -1 },
    q_009: { dimension: 'psychological_need', weight: 1 },
    q_010: { dimension: 'psychological_need', weight: 1 },
    q_011: { dimension: 'goal', weight: 1 },
    q_012: { dimension: 'goal', weight: 1 },
    q_013: { dimension: 'goal', weight: -1 },
    q_014: { dimension: 'goal', weight: 1 },
    q_015: { dimension: 'goal', weight: 1 },
    q_016: { dimension: 'goal', weight: 1 },
    q_017: { dimension: 'goal', weight: -1 },
    q_018: { dimension: 'goal', weight: 1 },
    q_019: { dimension: 'goal', weight: 1 },
    q_020: { dimension: 'goal', weight: 1 },
    q_021: { dimension: 'participation', weight: 1 },
    q_022: { dimension: 'participation', weight: 1 },
    q_023: { dimension: 'participation', weight: -1 },
    q_024: { dimension: 'participation', weight: 1 },
    q_025: { dimension: 'participation', weight: 1 },
    q_026: { dimension: 'participation', weight: -1 },
    q_027: { dimension: 'participation', weight: 1 },
    q_028: { dimension: 'participation', weight: 1 },
    q_029: { dimension: 'participation', weight: 1 },
    q_030: { dimension: 'participation', weight: -1 },
    q_031: { dimension: 'safety', weight: 1 },
    q_032: { dimension: 'safety', weight: 1 },
    q_033: { dimension: 'safety', weight: 1 },
    q_034: { dimension: 'safety', weight: -1 },
    q_035: { dimension: 'safety', weight: 1 },
    q_036: { dimension: 'safety', weight: 1 },
    q_037: { dimension: 'safety', weight: -1 },
    q_038: { dimension: 'safety', weight: 1 },
    q_039: { dimension: 'safety', weight: 1 },
    q_040: { dimension: 'safety', weight: 1 },
    q_041: { dimension: 'diversity', weight: 1 },
    q_042: { dimension: 'diversity', weight: 1 },
    q_043: { dimension: 'diversity', weight: -1 },
    q_044: { dimension: 'diversity', weight: 1 },
    q_045: { dimension: 'diversity', weight: 1 },
    q_046: { dimension: 'diversity', weight: 1 },
    q_047: { dimension: 'diversity', weight: -1 },
    q_048: { dimension: 'diversity', weight: 1 },
    q_049: { dimension: 'diversity', weight: 1 },
    q_050: { dimension: 'diversity', weight: 1 },
};
const MIN_SCALE = 1;
const MAX_SCALE = 5;
let RgciCalculatorService = class RgciCalculatorService {
    calculate(answers) {
        const dimensions = this.calculateDimensions(answers);
        const outcomes = this.calculateOutcomes(dimensions);
        const levels = this.assignLevels({ ...dimensions, ...outcomes });
        return { dimensions, outcomes, levels };
    }
    calculateDimensions(answers) {
        const sums = {
            psychological_need: { total: 0, count: 0, maxPossible: 0 },
            goal: { total: 0, count: 0, maxPossible: 0 },
            participation: { total: 0, count: 0, maxPossible: 0 },
            safety: { total: 0, count: 0, maxPossible: 0 },
            diversity: { total: 0, count: 0, maxPossible: 0 },
        };
        for (const answer of answers) {
            const mapping = DIMENSION_MAP[answer.question_id];
            if (!mapping)
                continue;
            const { dimension, weight } = mapping;
            const raw = Math.max(MIN_SCALE, Math.min(MAX_SCALE, answer.value));
            const normalized = weight === -1 ? (MAX_SCALE + MIN_SCALE) - raw : raw;
            sums[dimension].total += normalized;
            sums[dimension].count += 1;
            sums[dimension].maxPossible += MAX_SCALE;
        }
        const toScore = (dim) => {
            const { total, maxPossible, count } = sums[dim];
            if (count === 0)
                return 50;
            const minPossible = count * MIN_SCALE;
            return Math.round(((total - minPossible) / (maxPossible - minPossible)) * 100);
        };
        return {
            psychological_need: toScore('psychological_need'),
            goal: toScore('goal'),
            participation: toScore('participation'),
            safety: toScore('safety'),
            diversity: toScore('diversity'),
        };
    }
    calculateOutcomes(dim) {
        const performance = Math.round(0.35 * dim.goal +
            0.35 * dim.participation +
            0.20 * dim.diversity +
            0.10 * dim.psychological_need);
        const burnout_risk = Math.round(100 - (0.45 * dim.safety +
            0.35 * dim.psychological_need +
            0.20 * dim.participation));
        const wellbeing = 100 - burnout_risk;
        const satisfaction = Math.round(0.30 * dim.goal +
            0.30 * dim.safety +
            0.25 * dim.psychological_need +
            0.15 * dim.diversity);
        return {
            performance: Math.max(0, Math.min(100, performance)),
            burnout_risk: Math.max(0, Math.min(100, burnout_risk)),
            wellbeing: Math.max(0, Math.min(100, wellbeing)),
            satisfaction: Math.max(0, Math.min(100, satisfaction)),
        };
    }
    assignLevels(scores) {
        const getLevel = (score) => {
            if (score < 40)
                return 'low';
            if (score < 70)
                return 'mid';
            return 'high';
        };
        const result = {};
        for (const [key, value] of Object.entries(scores)) {
            result[key] = getLevel(value);
        }
        return result;
    }
    calculatePairCompatibility(profileA, profileB) {
        const dimensions = [
            'psychological_need',
            'goal',
            'participation',
            'safety',
            'diversity',
        ];
        const weights = {
            psychological_need: 0.25,
            goal: 0.25,
            participation: 0.20,
            safety: 0.20,
            diversity: 0.10,
        };
        const breakdown = {};
        let totalScore = 0;
        for (const dim of dimensions) {
            const diff = Math.abs(profileA[dim] - profileB[dim]);
            const dimScore = 1 - diff / 100;
            breakdown[dim] = Math.round(dimScore * 100) / 100;
            totalScore += dimScore * weights[dim];
        }
        return {
            score: Math.round(totalScore * 1000) / 1000,
            breakdown,
        };
    }
    calculateGroupScore(compatibility, performance, wellbeing, satisfaction) {
        const score = 0.45 * compatibility +
            0.20 * (performance / 100) +
            0.20 * (wellbeing / 100) +
            0.15 * (satisfaction / 100);
        return Math.round(score * 1000) / 1000;
    }
    getQualityLabel(groupScore) {
        if (groupScore >= 0.80)
            return 'optimal';
        if (groupScore >= 0.65)
            return 'acceptable';
        if (groupScore >= 0.50)
            return 'fallback';
        return 'critical';
    }
};
exports.RgciCalculatorService = RgciCalculatorService;
exports.RgciCalculatorService = RgciCalculatorService = __decorate([
    (0, common_1.Injectable)()
], RgciCalculatorService);
