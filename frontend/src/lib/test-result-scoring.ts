/**
 * Canonical scoring for the relationship-profile tests.
 *
 * Raw answers are kept intact.  Derived values are always rebuilt from those
 * answers so a retake, profile card and compatibility view cannot drift apart.
 */
export type TestScores = Record<string, any>;
export const REQUIRED_CORE_ANSWERS: Record<string, number> = {
  neo_ffi: 30, ecr_r: 18, erq: 10, iri: 10, gottman: 12,
  raavi_matching_basis_v1: 16, mbti: 16,
};

const numberAt = (answers: TestScores, id: number, fallback = 0) => {
  const value = Number(answers?.[id] ?? answers?.[String(id)] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
};

const sum = (answers: TestScores, ids: number[], reverse = new Set<number>(), scaleMax = 5, scaleMin = 1) =>
  ids.reduce((total, id) => total + (() => {
    const value = numberAt(answers, id);
    return reverse.has(id) ? scaleMax + scaleMin - value : value;
  })(), 0);

const percent = (value: number, max: number) =>
  max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;

const attachmentStyle = (anxiety: number, avoidance: number) => {
  if (anxiety < 36 && avoidance < 36) return "secure";
  if (anxiety >= 36 && avoidance < 36) return "anxious";
  if (anxiety < 36 && avoidance >= 36) return "avoidant";
  return "disorganized";
};

export function normalizeTestScores(testId: string, input: TestScores | string | null | undefined): TestScores {
  let source: TestScores = {};
  try { source = typeof input === "string" ? JSON.parse(input) : input || {}; } catch { source = {}; }
  const answers = source.answers && typeof source.answers === "object" ? source.answers : {};
  const hasAnswers = Object.keys(answers).length > 0;
  const hasCurrentVersionAnswers = !REQUIRED_CORE_ANSWERS[testId] || Object.keys(answers).length >= REQUIRED_CORE_ANSWERS[testId];
  const total = hasAnswers ? Object.values(answers).reduce((acc: number, value) => acc + (Number(value) || 0), 0) : source.total || 0;
  const result: TestScores = { ...source, answers, total };

  if (testId === "neo_ffi" && hasCurrentVersionAnswers) {
    const reverse = new Set([4, 6, 10, 12, 16, 18, 20, 22, 24, 28, 30]);
    result.E = sum(answers, [1, 2, 3, 4, 5, 6], reverse);
    result.A = sum(answers, [7, 8, 9, 10, 11, 12], reverse);
    result.C = sum(answers, [13, 14, 15, 16, 17, 18], reverse);
    result.N = sum(answers, [19, 20, 21, 22, 23, 24], reverse);
    result.O = sum(answers, [25, 26, 27, 28, 29, 30], reverse);
    ["E", "A", "C", "N", "O"].forEach(key => { result[`${key}_pct`] = percent(result[key], 30); });
  }

  if (testId === "ecr_r" && hasCurrentVersionAnswers) {
    result.ANX = sum(answers, [1, 2, 3, 4, 5, 6, 7, 8, 9], new Set(), 7);
    result.AVO = sum(answers, [10, 11, 12, 13, 14, 15, 16, 17, 18], new Set(), 7);
    result.attachment_style = attachmentStyle(result.ANX, result.AVO);
  }

  if (testId === "erq" && hasCurrentVersionAnswers) {
    result.CR = sum(answers, [1, 2, 3, 4, 5], new Set(), 7);
    result.ES = sum(answers, [6, 7, 8, 9, 10], new Set(), 7);
    result._CR_max = 35;
    result._ES_max = 35;
  }

  if (testId === "iri" && hasCurrentVersionAnswers) {
    // This product uses a 10-question short form (not the 28-question IRI).
    result.PT = sum(answers, [1, 2, 3, 9]);
    result.EC = sum(answers, [4, 5, 6, 8, 10]);
    result.PD = sum(answers, [7]);
    result.FS = null;
    result._PT_max = 20;
    result._EC_max = 25;
    result._PD_max = 5;
    result._FS_max = 0;
    result.empathy_score = Math.round((percent(result.PT, 20) + percent(result.EC, 25)) / 2);
  }

  if (testId === "gottman" && hasCurrentVersionAnswers) {
    result.criticism = sum(answers, [1, 2]);
    result.defensiveness = sum(answers, [3, 4]);
    result.stonewalling = sum(answers, [5, 6]);
    result.contempt = sum(answers, [7, 8]);
    result.empathy = sum(answers, [9, 10]);
    result.repair = sum(answers, [11, 12]);
    result.horsemen_total = result.criticism + result.defensiveness + result.stonewalling + result.contempt;
    result.positive_total = result.empathy + result.repair;
    // Low horsemen carries more weight than positive skills; both are explicit.
    result.relationship_health = Math.round((1 - result.horsemen_total / 40) * 70 + (result.positive_total / 20) * 30);
  }

  if (testId === "dass21") {
    result.D = sum(answers, [3, 5, 10, 13, 16, 17, 21], new Set(), 3, 0);
    result.A = sum(answers, [2, 4, 7, 9, 15, 19, 20], new Set(), 3, 0);
    result.S = sum(answers, [1, 6, 8, 11, 12, 14, 18], new Set(), 3, 0);
    // DASS-21: each 7-item subscale is multiplied by two for standard cut-offs.
    result.D_standard = result.D * 2;
    result.A_standard = result.A * 2;
    result.S_standard = result.S * 2;
    result.total_standard = result.total * 2;
  }

  if (testId === "asrs") {
    const thresholds = [2, 2, 2, 3, 3, 3];
    result.asrs_positive_count = thresholds.reduce((count, threshold, index) =>
      count + (numberAt(answers, index + 1) >= threshold ? 1 : 0), 0);
    result.inattention = sum(answers, [1, 2, 3, 4], new Set(), 4, 0);
    result.hyperactivity = sum(answers, [5, 6], new Set(), 4, 0);
  }

  if (testId === "mdq") {
    result.mdq_symptom_count = Array.from({ length: 13 }, (_, index) => numberAt(answers, index + 1)).filter(value => value === 1).length;
    result.mdq_concurrent = numberAt(answers, 14) === 1;
    result.mdq_impairment = numberAt(answers, 15) === 1;
  }

  if (testId === "ybocs") {
    result.obsession = sum(answers, [1, 2, 3, 4, 5], new Set(), 4, 0);
    result.compulsion = sum(answers, [6, 7, 8, 9, 10], new Set(), 4, 0);
    result.total = result.obsession + result.compulsion;
  }

  if (testId === "hexaco") {
    result.H = sum(answers, [1, 2, 3, 4]);
    result.E_h = sum(answers, [5, 6]);
    result.X = sum(answers, [7, 8]);
    result.C = sum(answers, [9, 10]);
    result.O = sum(answers, [11, 12]);
  }

  if (testId === "conflict_style") {
    const percentage = (ids: number[]) => Math.round(sum(answers, ids) / (ids.length * 5) * 100);
    result.collaborating = percentage([1, 6, 10]);
    result.competing = percentage([4, 7]);
    result.compromising = percentage([2, 9]);
    result.avoiding = percentage([3, 8]);
    result.accommodating = percentage([5]);
  }

  if (testId === "love_languages") {
    result.words = sum(answers, [1, 2]); result.time = sum(answers, [3, 4]);
    result.gifts = sum(answers, [5, 6]); result.acts = sum(answers, [7, 8]); result.touch = sum(answers, [9, 10]);
  }

  if (testId === "pid5") {
    result.negative_affect = sum(answers, [3, 4, 15], new Set(), 3, 0);
    result.detachment = sum(answers, [7, 8, 9, 10], new Set(), 3, 0);
    result.antagonism = sum(answers, [1, 2], new Set(), 3, 0);
    result.disinhibition = sum(answers, [5, 6, 13, 14], new Set(), 3, 0);
    result.psychoticism = sum(answers, [11, 12], new Set(), 3, 0);
  }

  if (testId === "ysq") {
    const schemas: Record<string, number[]> = { abandonment:[1,2], mistrust:[3,4], dependence:[5,6], defectiveness:[7,8], isolation:[9,10], unrelenting_standards:[11,12], entitlement:[13,14], self_sacrifice:[15,16], approval_seeking:[17,18] };
    Object.entries(schemas).forEach(([key, ids]) => { result[key] = sum(answers, ids, new Set(), 6); });
  }

  if ((testId === "raavi_matching_basis_v1" || testId === "mbti") && hasCurrentVersionAnswers) {
    const average = (ids: number[]) => ids.reduce((acc, id) => acc + numberAt(answers, id), 0) / ids.length;
    result.EI = Math.round((average([1, 3]) - average([2, 4])) * 2) / 2;
    result.SN = Math.round((average([6, 8]) - average([5, 7])) * 2) / 2;
    result.TF = Math.round((average([10, 12]) - average([9, 11])) * 2) / 2;
    result.JP = Math.round((average([13, 15]) - average([14, 16])) * 2) / 2;
    result.mbtiType = `${result.EI >= 0 ? "E" : "I"}${result.SN >= 0 ? "N" : "S"}${result.TF >= 0 ? "F" : "T"}${result.JP >= 0 ? "J" : "P"}`;
  }

  return result;
}

export function getTestProfileScore(testId: string, input: TestScores | string | null | undefined, mainResult = ""): number {
  const scores = normalizeTestScores(testId, input);
  if (testId === "neo_ffi") return Math.round((percent(scores.A, 30) + percent(scores.C, 30) + percent(scores.O, 30) + (100 - percent(scores.N, 30))) / 4);
  if (testId === "ecr_r") return Math.round(100 - (percent(scores.ANX, 63) + percent(scores.AVO, 63)) / 2);
  if (testId === "erq") return Math.round(percent(scores.CR, 35) * 0.7 + (100 - percent(scores.ES, 35)) * 0.3);
  if (testId === "iri") return scores.empathy_score ?? 50;
  if (testId === "gottman") return scores.relationship_health ?? 50;
  // MBTI represents a preference, not an achievement/health score.
  if (testId === "raavi_matching_basis_v1" || testId === "mbti") return 50;
  if (["phq9", "gad7", "bai", "isi", "dass21", "asrs", "bdi2", "pcl5", "ybocs", "mdq"].includes(testId)) {
    const max: TestScores = { phq9: 27, gad7: 21, bai: 63, isi: 28, dass21: 63, asrs: 24, bdi2: 63, pcl5: 80, ybocs: 40, mdq: 13 };
    return Math.max(10, 100 - Math.round((scores.total || 0) / max[testId] * 100));
  }
  return mainResult ? 75 : 65;
}
