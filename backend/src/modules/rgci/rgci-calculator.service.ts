import { Injectable } from '@nestjs/common';

const DIMENSION_MAP: Record<string, { dimension: string; weight: number }> = {
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

export interface DimensionScores {
  psychological_need: number;
  goal: number;
  participation: number;
  safety: number;
  diversity: number;
}

export interface OutcomeIndices {
  performance: number;
  burnout_risk: number;
  wellbeing: number;
  satisfaction: number;
}

export interface RgciCalculationResult {
  dimensions: DimensionScores;
  outcomes: OutcomeIndices;
  levels: Record<string, 'low' | 'mid' | 'high'>;
}

@Injectable()
export class RgciCalculatorService {
  calculate(
    answers: Array<{ question_id: string; value: number }>,
  ): RgciCalculationResult {
    const dimensions = this.calculateDimensions(answers);
    const outcomes = this.calculateOutcomes(dimensions);
    const levels = this.assignLevels({ ...dimensions, ...outcomes });

    return { dimensions, outcomes, levels };
  }

  private calculateDimensions(
    answers: Array<{ question_id: string; value: number }>,
  ): DimensionScores {
    const sums: Record<string, { total: number; count: number; maxPossible: number }> = {
      psychological_need: { total: 0, count: 0, maxPossible: 0 },
      goal:               { total: 0, count: 0, maxPossible: 0 },
      participation:      { total: 0, count: 0, maxPossible: 0 },
      safety:             { total: 0, count: 0, maxPossible: 0 },
      diversity:          { total: 0, count: 0, maxPossible: 0 },
    };

    for (const answer of answers) {
      const mapping = DIMENSION_MAP[answer.question_id];
      if (!mapping) continue;

      const { dimension, weight } = mapping;
      const raw = Math.max(MIN_SCALE, Math.min(MAX_SCALE, answer.value));
      const normalized = weight === -1 ? (MAX_SCALE + MIN_SCALE) - raw : raw;

      sums[dimension].total += normalized;
      sums[dimension].count += 1;
      sums[dimension].maxPossible += MAX_SCALE;
    }

    const toScore = (dim: string): number => {
      const { total, maxPossible, count } = sums[dim];
      if (count === 0) return 50; 
      const minPossible = count * MIN_SCALE;
      return Math.round(
        ((total - minPossible) / (maxPossible - minPossible)) * 100,
      );
    };

    return {
      psychological_need: toScore('psychological_need'),
      goal:               toScore('goal'),
      participation:      toScore('participation'),
      safety:             toScore('safety'),
      diversity:          toScore('diversity'),
    };
  }

  private calculateOutcomes(dim: DimensionScores): OutcomeIndices {
    const performance = Math.round(
      0.35 * dim.goal +
      0.35 * dim.participation +
      0.20 * dim.diversity +
      0.10 * dim.psychological_need,
    );

    const burnout_risk = Math.round(
      100 - (
        0.45 * dim.safety +
        0.35 * dim.psychological_need +
        0.20 * dim.participation
      ),
    );

    const wellbeing = 100 - burnout_risk;

    const satisfaction = Math.round(
      0.30 * dim.goal +
      0.30 * dim.safety +
      0.25 * dim.psychological_need +
      0.15 * dim.diversity,
    );

    return {
      performance: Math.max(0, Math.min(100, performance)),
      burnout_risk: Math.max(0, Math.min(100, burnout_risk)),
      wellbeing: Math.max(0, Math.min(100, wellbeing)),
      satisfaction: Math.max(0, Math.min(100, satisfaction)),
    };
  }

  private assignLevels(
    scores: Record<string, number>,
  ): Record<string, 'low' | 'mid' | 'high'> {
    const getLevel = (score: number): 'low' | 'mid' | 'high' => {
      if (score < 40) return 'low';
      if (score < 70) return 'mid';
      return 'high';
    };

    const result: Record<string, 'low' | 'mid' | 'high'> = {};
    for (const [key, value] of Object.entries(scores)) {
      result[key] = getLevel(value);
    }
    return result;
  }

  calculatePairCompatibility(
    profileA: DimensionScores,
    profileB: DimensionScores,
  ): { score: number; breakdown: Record<string, number> } {
    // پیاده‌سازی مستقیم spec مچینگ: similarity برای هدف/ایمنی،
    // تعادل برای مشارکت و تفاوت کنترل‌شده برای تنوع.
    const norm = (n: number) => Math.max(0, Math.min(1, Number(n || 0) / 100));
    const a = {
      psychological_need: norm(profileA.psychological_need), goal: norm(profileA.goal),
      participation: norm(profileA.participation), safety: norm(profileA.safety), diversity: norm(profileA.diversity),
    };
    const b = {
      psychological_need: norm(profileB.psychological_need), goal: norm(profileB.goal),
      participation: norm(profileB.participation), safety: norm(profileB.safety), diversity: norm(profileB.diversity),
    };
    const similarity = (x: number, y: number) => 1 - Math.abs(x - y);
    const safetyMin = Math.min(a.safety, b.safety);
    const safetyPenalty = safetyMin < 0.30 ? 0.25 : safetyMin < 0.45 ? 0.10 : 0;
    const safety = Math.max(0, similarity(a.safety, b.safety) - safetyPenalty);
    const participationAverage = (a.participation + b.participation) / 2;
    const participationPenalty = participationAverage < 0.35 ? 0.20 : participationAverage > 0.85 ? 0.10 : 0;
    const participation = Math.max(0, 1 - participationPenalty - Math.abs(a.participation - b.participation) * 0.30);
    const diversityDifference = Math.abs(a.diversity - b.diversity);
    const diversity = Math.max(0, Math.min(1,
      1 - Math.abs(diversityDifference - 0.25) - (diversityDifference > 0.60 ? 0.25 : 0),
    ));
    const needDifference = Math.abs(a.psychological_need - b.psychological_need);
    const need = Math.max(0, 1 - needDifference - (needDifference > 0.60 ? 0.25 : needDifference > 0.40 ? 0.10 : 0));
    const breakdown: Record<string, number> = {
      safety, participation, goal: similarity(a.goal, b.goal),
      psychological_need: need, diversity,
    };
    const totalScore =
      0.30 * safety + 0.25 * participation + 0.20 * breakdown.goal +
      0.15 * need + 0.10 * diversity;

    return {
      score: Math.round(totalScore * 1000) / 1000,
      breakdown,
    };
  }

  calculateGroupScore(
    compatibility: number,
    performance: number,
    wellbeing: number,
    satisfaction: number,
  ): number {
    const score =
      0.45 * compatibility +
      0.20 * (performance / 100) +
      0.20 * (wellbeing / 100) +
      0.15 * (satisfaction / 100);

    return Math.round(score * 1000) / 1000;
  }

  getQualityLabel(
    groupScore: number,
  ): 'optimal' | 'acceptable' | 'fallback' | 'critical' {
    if (groupScore >= 0.80) return 'optimal';
    if (groupScore >= 0.65) return 'acceptable';
    if (groupScore >= 0.50) return 'fallback';
    return 'critical';
  }
}
