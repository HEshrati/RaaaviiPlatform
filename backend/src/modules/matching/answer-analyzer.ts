/**
 * ═══════════════════════════════════════════════════════════════
 *  Answer-Level Analyzer — تحلیل جواب به جواب هر تست
 *  بالاترین دقت ممکن: هر سوال یه بُعد روانشناختی اضافه می‌کنه
 * ═══════════════════════════════════════════════════════════════
 */

// ── کاتالوگ کامل سوالات با معنای روانشناختی ──────────────────
export const QUESTION_META: Record<string, {
  subscale: string; facet?: string; reverse?: boolean; weight: number;
}[]> = {

  neo_ffi: [
    // E — Extraversion
    {subscale:"E", facet:"dominance",     reverse:false, weight:1.2},
    {subscale:"E", facet:"gregariousness",reverse:false, weight:1.0},
    {subscale:"E", facet:"assertiveness", reverse:false, weight:1.1},
    {subscale:"E", facet:"activity",      reverse:true,  weight:1.0},
    {subscale:"E", facet:"excitement",    reverse:false, weight:1.0},
    {subscale:"E", facet:"expression",    reverse:true,  weight:0.9},
    // A — Agreeableness
    {subscale:"A", facet:"empathy",       reverse:false, weight:1.2},
    {subscale:"A", facet:"trust",         reverse:false, weight:1.1},
    {subscale:"A", facet:"altruism",      reverse:false, weight:1.0},
    {subscale:"A", facet:"compliance",    reverse:true,  weight:0.9},
    {subscale:"A", facet:"cooperation",   reverse:false, weight:1.0},
    {subscale:"A", facet:"honesty",       reverse:true,  weight:1.1},
    // C — Conscientiousness
    {subscale:"C", facet:"planning",      reverse:false, weight:1.1},
    {subscale:"C", facet:"punctuality",   reverse:false, weight:1.0},
    {subscale:"C", facet:"detail",        reverse:false, weight:0.9},
    {subscale:"C", facet:"order",         reverse:true,  weight:1.0},
    {subscale:"C", facet:"persistence",   reverse:false, weight:1.2},
    {subscale:"C", facet:"procrastination",reverse:true, weight:1.0},
    // N — Neuroticism
    {subscale:"N", facet:"anxiety",       reverse:false, weight:1.2},
    {subscale:"N", facet:"depression",    reverse:false, weight:1.1},
    {subscale:"N", facet:"mood",          reverse:false, weight:1.0},
    {subscale:"N", facet:"sensitivity",   reverse:false, weight:0.9},
    {subscale:"N", facet:"self_doubt",    reverse:false, weight:1.0},
    {subscale:"N", facet:"stress",        reverse:false, weight:1.1},
    // O — Openness
    {subscale:"O", facet:"imagination",   reverse:false, weight:1.0},
    {subscale:"O", facet:"aesthetics",    reverse:false, weight:0.9},
    {subscale:"O", facet:"curiosity",     reverse:false, weight:1.1},
    {subscale:"O", facet:"creativity",    reverse:false, weight:1.0},
    {subscale:"O", facet:"flexibility",   reverse:false, weight:1.0},
    {subscale:"O", facet:"culture",       reverse:false, weight:0.9},
  ],

  ecr_r: Array.from({length:36}, (_,i) => ({
    subscale: i < 18 ? "ANX" : "AVO",
    facet: i < 18
      ? ["abandonment","approval","separation","reassurance","worry",
         "partner_needs","closeness","affection","fear","rejection",
         "dependency","focus","upset","emotions","partner_avail","nervous","attention","reassurance2"][i % 18]
      : ["uncomfortable","close_relationships","sharing","depend","easy_close",
         "alone","private","independent","uncomfortable2","open","hiding","partner_close",
         "uncomfortable3","sharing2","closeness2","secure","uncomfortable4","depend2"][i % 18],
    reverse: [1,2,5,7,8,13,14,16,17,22,23,24,25,26,27,29,30,31,32,33,34,35].includes(i+1),
    weight: 1.0,
  })),

  erq: [
    {subscale:"CR", facet:"reframe",      reverse:false, weight:1.2},
    {subscale:"ES", facet:"hide",         reverse:false, weight:1.2},
    {subscale:"CR", facet:"perspective",  reverse:false, weight:1.1},
    {subscale:"ES", facet:"control",      reverse:false, weight:1.0},
    {subscale:"CR", facet:"positive",     reverse:false, weight:1.1},
    {subscale:"ES", facet:"suppress",     reverse:false, weight:1.1},
    {subscale:"CR", facet:"different",    reverse:false, weight:1.0},
    {subscale:"ES", facet:"show_nothing", reverse:false, weight:1.0},
    {subscale:"CR", facet:"calm",         reverse:false, weight:1.1},
    {subscale:"ES", facet:"not_show",     reverse:false, weight:1.0},
  ],

  iri: Array.from({length:28}, (_,i) => ({
    subscale: ["PT","EC","PT","EC","PT","FS","PT","EC","PT","EC",
               "PD","FS","EC","FS","PD","PT","FS","PD","PD","EC",
               "PD","PT","FS","PT","PD","FS","EC","PD"][i],
    facet: ["perspective","empathic","taking_perspective","feel","imagining",
            "fantasy","viewpoint","concerned","other_emergency","tender",
            "distress","daydream","compassion","lose","uncomfortable","imagined",
            "fictional","emergency","others_misfortune","sorry","uncomfortable2",
            "other_view","move","understand","helpless","drawn","sympathy","scared"][i],
    reverse: [1,5,7,12,14,20].includes(i+1),
    weight: 1.0,
  })),
};

// ── محاسبه fingerprint از raw answers ────────────────────────
export function buildAnswerFingerprint(
  testId: string,
  scores: any
): Record<string, number> {
  const fingerprint: Record<string, number> = {};
  const answers = scores?.answers || {};
  const meta = QUESTION_META[testId];

  if (!meta || !Object.keys(answers).length) {
    // اگه raw answers نداشت از subscale scores استفاده کن
    return buildFromSubscales(testId, scores);
  }

  // جواب به جواب پردازش
  meta.forEach((q, idx) => {
    const qId = idx + 1;
    const rawVal = answers[qId] ?? answers[String(qId)];
    if (rawVal === undefined) return;
    const val = typeof rawVal === 'number' ? rawVal : parseAnswerKey(rawVal);
    const normalized = q.reverse ? (6 - val) : val; // normalize to 1-5
    const key = `${q.subscale}_${q.facet}`;
    fingerprint[key] = (fingerprint[key] || 0) + normalized * q.weight;
  });

  return fingerprint;
}

function buildFromSubscales(testId: string, scores: any): Record<string, number> {
  const fp: Record<string, number> = {};
  if (!scores) return fp;
  // NEO
  if (testId === 'neo_ffi') {
    ['E','A','C','N','O'].forEach(dim => {
      if (scores[dim] !== undefined) fp[dim] = scores[dim];
    });
  }
  // ECR
  if (testId === 'ecr_r') {
    if (scores.ANX !== undefined) fp.ANX = scores.ANX;
    if (scores.AVO !== undefined) fp.AVO = scores.AVO;
  }
  // ERQ
  if (testId === 'erq') {
    if (scores.CR !== undefined) fp.CR = scores.CR;
    if (scores.ES !== undefined) fp.ES = scores.ES;
  }
  return fp;
}

function parseAnswerKey(key: string): number {
  if (key.includes('_e') || key.includes('_n') || key.includes('_s') ||
      key.includes('_f') || key.includes('_j') || key.includes('_p')) {
    return key.endsWith('_e')||key.endsWith('_n')||key.endsWith('_t')||
           key.endsWith('_j') ? 4 : 2;
  }
  return 3;
}

// ── شباهت بین دو fingerprint (cosine similarity) ─────────────
export function cosineSimilarity(a: Record<string,number>, b: Record<string,number>): number {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  let dot = 0, normA = 0, normB = 0;
  for (const k of keys) {
    const av = a[k] || 0, bv = b[k] || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (!normA || !normB) return 0.5;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── سازگاری ایده‌آل بر اساس تحقیقات علمی ───────────────────
// برخی ابعاد: شباهت = بهتر (N, C, A)
// برخی ابعاد: تنوع بهینه = بهتر (E: درون+برون‌گرا)
// برخی ابعاد: مکمل = بهتر (dominant+submissive)
export function idealCompatibility(
  testId: string,
  a: Record<string,number>,
  b: Record<string,number>
): { score: number; details: string[] } {
  const details: string[] = [];
  let score = 0; let count = 0;

  if (testId === 'neo_ffi') {
    // N: هر دو پایین = بهترین (0.3 وزن)
    const nA = a['N'] ?? 15, nB = b['N'] ?? 15;
    const nScore = 100 - ((nA + nB) / 60) * 100;
    if (nA < 12 && nB < 12) details.push('✅ روان‌رنجوری پایین در هر دو');
    else if (nA > 20 || nB > 20) details.push('⚠️ روان‌رنجوری بالا');
    score += nScore * 0.3; count++;

    // A: شباهت + هر دو بالا (0.25 وزن)
    const aA = a['A'] ?? 15, aB = b['A'] ?? 15;
    const aScore = 100 - Math.abs(aA - aB) / 30 * 100;
    const aMean = (aA + aB) / 2;
    const aBonus = aMean > 20 ? 20 : 0;
    if (aMean > 20) details.push('✅ توافق‌پذیری بالا');
    score += (aScore + aBonus) * 0.25; count++;

    // C: شباهت (0.15 وزن)
    const cA = a['C'] ?? 15, cB = b['C'] ?? 15;
    const cScore = 100 - Math.abs(cA - cB) / 30 * 100;
    score += cScore * 0.15; count++;

    // E: تنوع بهینه درون+برون (0.15 وزن)
    const eA = a['E'] ?? 15, eB = b['E'] ?? 15;
    const eDiff = Math.abs(eA - eB);
    const eScore = eDiff > 5 && eDiff < 20 ? 85 : eDiff === 0 ? 70 : 60;
    if (eDiff > 5) details.push('✅ ترکیب درون+برون‌گرا');
    score += eScore * 0.15; count++;

    // O: شباهت (0.15 وزن)
    const oA = a['O'] ?? 15, oB = b['O'] ?? 15;
    const oScore = 100 - Math.abs(oA - oB) / 30 * 80;
    score += oScore * 0.15; count++;
  }

  if (testId === 'ecr_r') {
    const anxA = a['ANX'] ?? 31, anxB = b['ANX'] ?? 31;
    const avoA = a['AVO'] ?? 31, avoB = b['AVO'] ?? 31;
    // ایمن+ایمن: بهترین
    const anxScore = 100 - ((anxA + anxB) / 126) * 80;
    const avoScore = 100 - ((avoA + avoB) / 126) * 80;
    // اضطرابی + اجتنابی = بدترین
    if (anxA > 36 && avoB > 36) { score += 25; details.push('⚠️ اضطرابی+اجتنابی'); }
    else { score += (anxScore * 0.6 + avoScore * 0.4); }
    count++;
    if (anxA < 28 && anxB < 28 && avoA < 28 && avoB < 28)
      details.push('✅ هر دو دلبستگی ایمن');
  }

  if (testId === 'erq') {
    const crA = a['CR'] ?? 21, crB = b['CR'] ?? 21;
    const esA = a['ES'] ?? 14, esB = b['ES'] ?? 14;
    const crScore = ((crA + crB) / 84) * 100;
    const esScore = 100 - ((esA + esB) / 56) * 100;
    score += crScore * 0.6 + esScore * 0.4;
    count++;
    if (crA > 28 && crB > 28) details.push('✅ بازارزیابی قوی در هر دو');
  }

  return { score: count > 0 ? Math.round(score) : 65, details };
}

// ── تشخیص facet level differences ───────────────────────────
export function getFacetInsights(
  aFP: Record<string,number>,
  bFP: Record<string,number>
): string[] {
  const insights: string[] = [];
  const allKeys = Object.keys(aFP);

  for (const key of allKeys) {
    const av = aFP[key] || 0, bv = bFP[key] || 0;
    const diff = Math.abs(av - bv);
    if (diff > 3) {
      const [sub, facet] = key.split('_');
      insights.push(`تفاوت در ${facet} (${sub}): ${Math.round(diff * 10) / 10}`);
    }
  }
  return insights.slice(0, 5);
}
