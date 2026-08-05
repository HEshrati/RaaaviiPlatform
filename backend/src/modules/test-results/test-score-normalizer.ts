export type Scores = Record<string, any>;
export const REQUIRED_CORE_ANSWERS: Record<string, number> = {
  neo_ffi: 30, ecr_r: 18, erq: 10, iri: 10, gottman: 12,
  raavi_matching_basis_v1: 16, mbti: 16,
};
const TEST_ANSWER_SPECS: Record<string, { count: number; min: number; max: number }> = {
  raavi_matching_basis_v1:{count:16,min:1,max:5}, mbti:{count:16,min:1,max:5}, neo_ffi:{count:30,min:1,max:5},
  ecr_r:{count:18,min:1,max:7}, gottman:{count:12,min:1,max:5}, hexaco:{count:12,min:1,max:5}, iri:{count:10,min:1,max:5},
  erq:{count:10,min:1,max:7}, conflict_style:{count:10,min:1,max:5}, love_languages:{count:10,min:1,max:5}, sexual_compat:{count:8,min:1,max:5},
  phq9:{count:9,min:0,max:3}, gad7:{count:7,min:0,max:3}, dass21:{count:21,min:0,max:3}, bai:{count:21,min:0,max:3}, isi:{count:7,min:0,max:4},
  asrs:{count:6,min:0,max:4}, mdq:{count:15,min:0,max:1}, ybocs:{count:10,min:0,max:4}, pcl5:{count:20,min:0,max:4}, bdi2:{count:21,min:0,max:3},
  pid5:{count:15,min:0,max:3}, ysq:{count:18,min:1,max:6}, mmpi_screen:{count:12,min:0,max:1}, mcmi_screen:{count:12,min:0,max:1},
};

export function hasValidTestAnswers(testName: string, input: Scores | string | null | undefined): boolean {
  const spec = TEST_ANSWER_SPECS[testName];
  if (!spec) return true;
  let scores: Scores = {};
  try { scores = typeof input === 'string' ? JSON.parse(input) : input || {}; } catch { return false; }
  const answers = scores.answers && typeof scores.answers === 'object' ? scores.answers : {};
  const values = Array.from({ length: spec.count }, (_, index) => Number(answers[index + 1] ?? answers[String(index + 1)]));
  return Object.keys(answers).length === spec.count
    && values.every(value => Number.isInteger(value) && value >= spec.min && value <= spec.max);
}

export function hasCompleteCoreAnswers(testName: string, input: Scores | string | null | undefined): boolean {
  const required = REQUIRED_CORE_ANSWERS[testName];
  if (!required) return true;
  let scores: Scores = {};
  try { scores = typeof input === 'string' ? JSON.parse(input) : input || {}; } catch { return false; }
  const answers = scores.answers && typeof scores.answers === 'object' ? scores.answers : {};
  return Object.keys(answers).length >= required;
}

const numberAt = (answers: Scores, id: number, fallback = 0): number => {
  const value = Number(answers?.[id] ?? answers?.[String(id)] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
};

const sum = (answers: Scores, ids: number[], reverse = new Set<number>(), scaleMax = 5, scaleMin = 1): number =>
  ids.reduce((total, id) => {
    const value = numberAt(answers, id);
    return total + (reverse.has(id) ? scaleMax + scaleMin - value : value);
  }, 0);

const styleFor = (anxiety: number, avoidance: number): string => {
  if (anxiety < 36 && avoidance < 36) return 'secure';
  if (anxiety >= 36 && avoidance < 36) return 'anxious';
  if (anxiety < 36 && avoidance >= 36) return 'avoidant';
  return 'disorganized';
};

/** Rebuild derived values from raw answers before persistence. */
export function normalizeTestScores(testName: string, input: Scores | string | null | undefined): Scores {
  let source: Scores = {};
  try { source = typeof input === 'string' ? JSON.parse(input) : input || {}; } catch { source = {}; }
  const answers = source.answers && typeof source.answers === 'object' ? source.answers : {};
  const hasAnswers = Object.keys(answers).length > 0;
  const hasCurrentVersionAnswers = !REQUIRED_CORE_ANSWERS[testName] || Object.keys(answers).length >= REQUIRED_CORE_ANSWERS[testName];
  const total = hasAnswers
    ? Object.values(answers).reduce((acc: number, value) => acc + (Number(value) || 0), 0)
    : Number(source.total) || 0;
  const result: Scores = { ...source, answers, total };
  if (!hasAnswers) return result;

  if (testName === 'neo_ffi' && hasCurrentVersionAnswers) {
    const reverse = new Set([4, 6, 10, 12, 16, 18, 20, 22, 24, 28, 30]);
    result.E = sum(answers, [1, 2, 3, 4, 5, 6], reverse);
    result.A = sum(answers, [7, 8, 9, 10, 11, 12], reverse);
    result.C = sum(answers, [13, 14, 15, 16, 17, 18], reverse);
    result.N = sum(answers, [19, 20, 21, 22, 23, 24], reverse);
    result.O = sum(answers, [25, 26, 27, 28, 29, 30], reverse);
  }
  if (testName === 'ecr_r' && hasCurrentVersionAnswers) {
    result.ANX = sum(answers, [1, 2, 3, 4, 5, 6, 7, 8, 9], new Set(), 7);
    result.AVO = sum(answers, [10, 11, 12, 13, 14, 15, 16, 17, 18], new Set(), 7);
    result.attachment_style = styleFor(result.ANX, result.AVO);
  }
  if (testName === 'erq' && hasCurrentVersionAnswers) {
    result.CR = sum(answers, [1, 2, 3, 4, 5], new Set(), 7);
    result.ES = sum(answers, [6, 7, 8, 9, 10], new Set(), 7);
    result._CR_max = 35;
    result._ES_max = 35;
  }
  if (testName === 'iri' && hasCurrentVersionAnswers) {
    result.PT = sum(answers, [1, 2, 3, 9]);
    result.EC = sum(answers, [4, 5, 6, 8, 10]);
    result.PD = sum(answers, [7]);
    result.FS = null;
    result._PT_max = 20;
    result._EC_max = 25;
    result._PD_max = 5;
    result._FS_max = 0;
  }
  if (testName === 'gottman' && hasCurrentVersionAnswers) {
    result.criticism = sum(answers, [1, 2]);
    result.defensiveness = sum(answers, [3, 4]);
    result.stonewalling = sum(answers, [5, 6]);
    result.contempt = sum(answers, [7, 8]);
    result.empathy = sum(answers, [9, 10]);
    result.repair = sum(answers, [11, 12]);
    result.horsemen_total = result.criticism + result.defensiveness + result.stonewalling + result.contempt;
    result.positive_total = result.empathy + result.repair;
    result.relationship_health = Math.round((1 - result.horsemen_total / 40) * 70 + (result.positive_total / 20) * 30);
  }
  if (testName === 'dass21') {
    result.D = sum(answers, [3,5,10,13,16,17,21], new Set(), 3);
    result.A = sum(answers, [2,4,7,9,15,19,20], new Set(), 3);
    result.S = sum(answers, [1,6,8,11,12,14,18], new Set(), 3);
    result.D_standard = result.D * 2;
    result.A_standard = result.A * 2;
    result.S_standard = result.S * 2;
    result.total_standard = result.total * 2;
  }
  if (testName === 'asrs') {
    const thresholds = [2,2,2,3,3,3];
    result.asrs_positive_count = thresholds.reduce((count, threshold, index) => count + (numberAt(answers, index + 1) >= threshold ? 1 : 0), 0);
    result.inattention = sum(answers, [1,2,3,4], new Set(), 4);
    result.hyperactivity = sum(answers, [5,6], new Set(), 4);
  }
  if (testName === 'mdq') {
    result.mdq_symptom_count = Array.from({ length: 13 }, (_, index) => numberAt(answers, index + 1)).filter(value => value === 1).length;
    result.mdq_concurrent = numberAt(answers, 14) === 1;
    result.mdq_impairment = numberAt(answers, 15) === 1;
  }
  if (testName === 'ybocs') {
    result.obsession = sum(answers, [1,2,3,4,5], new Set(), 4, 0);
    result.compulsion = sum(answers, [6,7,8,9,10], new Set(), 4, 0);
    result.total = result.obsession + result.compulsion;
  }
  if (testName === 'hexaco') {
    result.H = sum(answers, [1,2,3,4]);
    result.E_h = sum(answers, [5,6]);
    result.X = sum(answers, [7,8]);
    result.C = sum(answers, [9,10]);
    result.O = sum(answers, [11,12]);
  }
  if (testName === 'conflict_style') {
    const percentage = (ids: number[]) => Math.round(sum(answers, ids) / (ids.length * 5) * 100);
    result.collaborating = percentage([1,6,10]);
    result.competing = percentage([4,7]);
    result.compromising = percentage([2,9]);
    result.avoiding = percentage([3,8]);
    result.accommodating = percentage([5]);
  }
  if (testName === 'love_languages') {
    result.words = sum(answers, [1,2]); result.time = sum(answers, [3,4]);
    result.gifts = sum(answers, [5,6]); result.acts = sum(answers, [7,8]); result.touch = sum(answers, [9,10]);
  }
  if (testName === 'pid5') {
    result.negative_affect = sum(answers, [3,4,15], new Set(), 3, 0);
    result.detachment = sum(answers, [7,8,9,10], new Set(), 3, 0);
    result.antagonism = sum(answers, [1,2], new Set(), 3, 0);
    result.disinhibition = sum(answers, [5,6,13,14], new Set(), 3, 0);
    result.psychoticism = sum(answers, [11,12], new Set(), 3, 0);
  }
  if (testName === 'ysq') {
    const schemas: Record<string, number[]> = { abandonment:[1,2], mistrust:[3,4], dependence:[5,6], defectiveness:[7,8], isolation:[9,10], unrelenting_standards:[11,12], entitlement:[13,14], self_sacrifice:[15,16], approval_seeking:[17,18] };
    Object.entries(schemas).forEach(([key, ids]) => { result[key] = sum(answers, ids, new Set(), 6); });
  }
  if ((testName === 'raavi_matching_basis_v1' || testName === 'mbti') && hasCurrentVersionAnswers) {
    const average = (ids: number[]) => ids.reduce((acc, id) => acc + numberAt(answers, id), 0) / ids.length;
    result.EI = Math.round((average([1, 3]) - average([2, 4])) * 2) / 2;
    result.SN = Math.round((average([6, 8]) - average([5, 7])) * 2) / 2;
    result.TF = Math.round((average([10, 12]) - average([9, 11])) * 2) / 2;
    result.JP = Math.round((average([13, 15]) - average([14, 16])) * 2) / 2;
    result.mbtiType = `${result.EI >= 0 ? 'E' : 'I'}${result.SN >= 0 ? 'N' : 'S'}${result.TF >= 0 ? 'F' : 'T'}${result.JP >= 0 ? 'J' : 'P'}`;
  }
  return result;
}

export function derivedMainResult(testName: string, scores: Scores, fallback = 'completed'): string {
  if ((testName === 'raavi_matching_basis_v1' || testName === 'mbti') && scores.mbtiType) return scores.mbtiType;
  if (testName === 'neo_ffi') return 'پروفایل پنج‌عاملی تکمیل شد';
  if (testName === 'hexaco') return 'پروفایل شخصیت کوتاه تکمیل شد';
  if (testName === 'erq') return Number(scores.CR || 0) >= Number(scores.ES || 0) ? 'بازارزیابی شناختی غالب' : 'سرکوب هیجان غالب';
  if (testName === 'iri') return Number(scores.EC || 0) >= Number(scores.PT || 0) ? 'همدلی هیجانی غالب' : 'همدلی شناختی غالب';
  if (testName === 'gottman' && scores.horsemen_total !== undefined) {
    if (scores.horsemen_total <= 8) return 'رابطه سالم';
    const entries = Object.entries({ criticism: scores.criticism || 0, contempt: scores.contempt || 0, defensiveness: scores.defensiveness || 0, stonewalling: scores.stonewalling || 0 });
    const key = entries.sort(([, a], [, b]) => Number(b) - Number(a))[0]?.[0];
    return ({ criticism: 'انتقاد', contempt: 'تحقیر', defensiveness: 'دفاعی‌بودن', stonewalling: 'سنگ‌شدن' } as Scores)[key] || 'نیاز به بهبود';
  }
  if (testName === 'ecr_r' && scores.attachment_style) return ({ secure:'سبک دلبستگی ایمن', anxious:'سبک دلبستگی اضطرابی', avoidant:'سبک دلبستگی اجتنابی', disorganized:'سبک دلبستگی دوسوگرا' } as Scores)[scores.attachment_style] || fallback;
  if (testName === 'conflict_style') {
    const labels: Scores = { collaborating:'همکارانه', competing:'رقابتی', compromising:'مصالحه', avoiding:'اجتنابی', accommodating:'سازگار' };
    const key = Object.keys(labels).sort((a, b) => Number(scores[b] || 0) - Number(scores[a] || 0))[0];
    return labels[key] || fallback;
  }
  if (testName === 'love_languages') {
    const labels: Scores = { words:'کلام تأییدی', time:'زمان باکیفیت', gifts:'هدیه', acts:'خدمت', touch:'تماس فیزیکی' };
    const key = Object.keys(labels).sort((a, b) => Number(scores[b] || 0) - Number(scores[a] || 0))[0];
    return labels[key] || fallback;
  }
  if (testName === 'dass21') {
    const levels: [string, number, number[]][] = [['افسردگی', Number(scores.D_standard || 0), [9,13,20,27]], ['اضطراب', Number(scores.A_standard || 0), [7,9,14,19]], ['استرس', Number(scores.S_standard || 0), [14,18,25,33]]];
    const level = (value: number, cuts: number[]) => value <= cuts[0] ? 0 : value <= cuts[1] ? 1 : value <= cuts[2] ? 2 : value <= cuts[3] ? 3 : 4;
    const highest = levels.map(([name, value, cuts]) => ({ name, value: level(value, cuts) })).sort((a, b) => b.value - a.value)[0];
    return `${highest.name}: ${['طبیعی','خفیف','متوسط','شدید','بسیار شدید'][highest.value]}`;
  }
  if (testName === 'asrs' && scores.asrs_positive_count !== undefined) return scores.asrs_positive_count >= 4 ? 'غربالگری مثبت — ارزیابی تخصصی پیشنهاد می‌شود' : 'غربالگری منفی';
  if (testName === 'mdq') {
    const symptoms = Number(scores.mdq_symptom_count ?? 0);
    return symptoms >= 7 && scores.mdq_concurrent === true && scores.mdq_impairment === true
      ? 'نیازمند ارزیابی بالینی' : 'زیر آستانهٔ غربالگری';
  }
  return fallback;
}

export function smartProfileProjection(testName: string, scores: Scores): Scores {
  if (testName === 'neo_ffi') return { neo_e: scores.E, neo_a: scores.A, neo_c: scores.C, neo_n: scores.N, neo_o: scores.O };
  if (testName === 'ecr_r') return { ecr_anxiety: scores.ANX, ecr_avoidance: scores.AVO, attachment_style: scores.attachment_style || styleFor(scores.ANX, scores.AVO) };
  if (testName === 'erq') return { erq_reappraisal: scores.CR, erq_suppression: scores.ES };
  if (testName === 'iri') return { iri_empathy: scores.EC, iri_perspective: scores.PT };
  if (testName === 'gottman') return Number.isFinite(scores.relationship_health) ? {
    gottman_score: scores.relationship_health,
    gottman_horsemen: { criticism: scores.criticism, contempt: scores.contempt, defensiveness: scores.defensiveness, stonewalling: scores.stonewalling },
  } : { gottman_score: null, gottman_horsemen: null };
  if (testName === 'raavi_matching_basis_v1' || testName === 'mbti') return { mbti_type: scores.mbtiType, mbti_ei: scores.EI, mbti_sn: scores.SN, mbti_tf: scores.TF, mbti_jp: scores.JP };
  return {};
}
