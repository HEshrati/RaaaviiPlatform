import { Injectable } from '@nestjs/common';

export interface UserPsychProfile {
  userId: string;
  // NEO Big Five (0-30 هر بُعد)
  neo: { E: number; A: number; C: number; N: number; O: number } | null;
  // ECR-R دلبستگی (9-63)
  ecr: { anxiety: number; avoidance: number; style: 'secure'|'anxious'|'avoidant'|'disorganized' } | null;
  // ERQ تنظیم هیجان (5-35)
  erq: { reappraisal: number; suppression: number } | null;
  // IRI همدلی (0-40)
  iri: { perspective: number; empathy: number } | null;
  // Gottman الگوی ارتباطی (0-60)
  gottman: { toxic: number; healthy: number } | null;
  // PHQ-9 افسردگی (0-27)
  phq9: number | null;
  // GAD-7 اضطراب (0-21)
  gad7: number | null;
  // Love Languages (کدام غالبه)
  loveLanguage: string | null;
  // Conflict Style
  conflictStyle: string | null;
  // MBTI
  mbti: string | null;
  // Red Flags
  redFlags: string[];
  // امتیاز کلی سلامت روان (0-100)
  mentalHealthScore: number;
  // امتیاز آمادگی رابطه (0-100)
  relationshipReadiness: number;
}

@Injectable()
export class PsychometricService {

  /**
   * ساخت پروفایل روان‌سنجی کامل از نتایج تست‌ها
   */
  buildProfile(userId: string, testResults: any[]): UserPsychProfile {
    const profile: UserPsychProfile = {
      userId,
      neo: null, ecr: null, erq: null, iri: null, gottman: null,
      phq9: null, gad7: null, loveLanguage: null,
      conflictStyle: null, mbti: null,
      redFlags: [], mentalHealthScore: 0, relationshipReadiness: 0,
    };

    for (const r of testResults) {
      const id = (r.test_id || r.test_name || '').toLowerCase();
      const s = r.scores || {};

      // NEO Big Five
      if (id.includes('neo')) {
        profile.neo = {
          E: this.extract(s, ['E','extraversion'], 15),
          A: this.extract(s, ['A','agreeableness'], 15),
          C: this.extract(s, ['C','conscientiousness'], 15),
          N: this.extract(s, ['N','neuroticism'], 15),
          O: this.extract(s, ['O','openness'], 15),
        };
      }

      // ECR-R دلبستگی
      if (id.includes('ecr')) {
        const anx = this.extract(s, ['ANX','anxiety'], 27);
        const avo = this.extract(s, ['AVO','avoidance'], 27);
        profile.ecr = {
          anxiety: anx, avoidance: avo,
          style: this.attachmentStyle(anx, avo),
        };
      }

      // ERQ
      if (id.includes('erq')) {
        profile.erq = {
          reappraisal: this.extract(s, ['CR','reappraisal'], 21),
          suppression: this.extract(s, ['ES','suppression'], 14),
        };
      }

      // IRI
      if (id.includes('iri')) {
        profile.iri = {
          perspective: this.extract(s, ['PT','perspective'], 20),
          empathy: this.extract(s, ['EC','empathy'], 25),
        };
      }

      // Gottman
      if (id.includes('gottman')) {
        const toxic = (s.criticism||0) + (s.contempt||0) + (s.defensive||0) + (s.stonewalling||0);
        const healthy = (s.empathy||0) + (s.repair||0);
        profile.gottman = { toxic, healthy };
      }

      // PHQ-9
      if (id.includes('phq9') || id.includes('phq_9')) {
        profile.phq9 = this.extract(s, ['total','score'], 0);
        if (profile.phq9 === 0 && r.total_score) profile.phq9 = r.total_score;
      }

      // GAD-7
      if (id.includes('gad7') || id.includes('gad_7')) {
        profile.gad7 = this.extract(s, ['total','score'], 0);
        if (profile.gad7 === 0 && r.total_score) profile.gad7 = r.total_score;
      }

      // Love Languages
      if (id.includes('love')) {
        const langs = { words: s.words||0, time: s.time||0, gifts: s.gifts||0, service: s.service||0, touch: s.touch||0 };
        profile.loveLanguage = Object.entries(langs).sort((a,b) => b[1]-a[1])[0]?.[0] || null;
      }

      // Conflict Style
      if (id.includes('conflict')) {
        const styles = { collab: s.collab||0, compro: s.compro||0, avoid: s.avoid||0, compete: s.compete||0 };
        profile.conflictStyle = Object.entries(styles).sort((a,b) => b[1]-a[1])[0]?.[0] || null;
      }

      // MBTI
      if (id.includes('mbti') || id.includes('matching_basis')) {
        profile.mbti = r.main_result?.split(' ')[0] || s.fullType?.split(' ')[0] || null;
      }
    }

    // Red Flags
    profile.redFlags = this.detectRedFlags(profile);
    profile.mentalHealthScore = this.calcMentalHealthScore(profile);
    profile.relationshipReadiness = this.calcRelationshipReadiness(profile);

    return profile;
  }

  private attachmentStyle(anx: number, avo: number): 'secure'|'anxious'|'avoidant'|'disorganized' {
    const highAnx = anx > 36;
    const highAvo = avo > 36;
    if (!highAnx && !highAvo) return 'secure';
    if (highAnx && !highAvo) return 'anxious';
    if (!highAnx && highAvo) return 'avoidant';
    return 'disorganized';
  }

  private detectRedFlags(p: UserPsychProfile): string[] {
    const flags: string[] = [];
    if (p.phq9 !== null && p.phq9 >= 15) flags.push('افسردگی شدید');
    if (p.phq9 !== null && p.phq9 >= 20) flags.push('افسردگی بحرانی');
    if (p.gad7 !== null && p.gad7 >= 15) flags.push('اضطراب شدید');
    if (p.ecr?.style === 'disorganized') flags.push('دلبستگی بی‌سازمان');
    if (p.gottman && p.gottman.toxic > 16) flags.push('الگوهای ارتباطی مخرب');
    if (p.neo && p.neo.N > 24) flags.push('روان‌رنجوری بالا');
    return flags;
  }

  private calcMentalHealthScore(p: UserPsychProfile): number {
    let score = 80;
    if (p.phq9 !== null) score -= Math.min(30, p.phq9 * 1.5);
    if (p.gad7 !== null) score -= Math.min(20, p.gad7 * 1.2);
    if (p.neo) score -= Math.max(0, (p.neo.N - 15) * 0.8);
    if (p.ecr?.style === 'disorganized') score -= 15;
    if (p.ecr?.style === 'anxious') score -= 8;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calcRelationshipReadiness(p: UserPsychProfile): number {
    let score = 60;
    if (p.ecr?.style === 'secure') score += 20;
    if (p.ecr?.style === 'anxious') score -= 10;
    if (p.ecr?.style === 'avoidant') score -= 15;
    if (p.ecr?.style === 'disorganized') score -= 25;
    if (p.erq && p.erq.reappraisal > 21) score += 10;
    if (p.iri && p.iri.empathy > 15) score += 8;
    if (p.gottman && p.gottman.healthy > p.gottman.toxic) score += 10;
    if (p.neo && p.neo.A > 18) score += 5;
    if (p.redFlags.length > 0) score -= p.redFlags.length * 8;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private extract(s: any, keys: string[], def: number): number {
    for (const k of keys) {
      if (s[k] !== undefined && s[k] !== null) return Number(s[k]);
      if (s[k.toLowerCase()] !== undefined) return Number(s[k.toLowerCase()]);
    }
    return def;
  }
}
