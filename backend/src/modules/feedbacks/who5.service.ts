import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class Who5Service {
  constructor(private readonly dataSource: DataSource) {}

  // سوالات WHO-5
  static readonly QUESTIONS = [
    'در دو هفته گذشته، روحیه‌ام خوب بوده و سرحال بوده‌ام.',
    'در دو هفته گذشته، آرام و راحت بوده‌ام.',
    'در دو هفته گذشته، احساس کرده‌ام فعال و پرانرژی هستم.',
    'در دو هفته گذشته، با خواب خوب و آسوده از خواب برخاسته‌ام.',
    'در دو هفته گذشته، زندگی روزانه‌ام پر از چیزهایی بوده که برایم جالب است.',
  ];

  // 0=هرگز، 1=گاهی، 2=کمتر از نیمی از مواقع، 3=بیشتر از نیمی، 4=اکثراً، 5=همیشه
  static readonly LABELS = ['هرگز', 'گاهی', 'کمتر از نیمی از مواقع', 'بیشتر از نیمی از مواقع', 'اکثراً', 'همیشه'];

  async submit(userId: string, eventId: string | null, phase: 'pre' | 'post', scores: number[]) {
    if (scores.length !== 5) throw new BadRequestException('باید 5 پاسخ ارسال کنید');
    if (scores.some(s => s < 0 || s > 5)) throw new BadRequestException('مقدار هر پاسخ باید بین 0 تا 5 باشد');

    const total = scores.reduce((a, b) => a + b, 0) * 4; // 0-100

    await this.dataSource.query(
      `INSERT INTO who5_responses (user_id, event_id, phase, q1, q2, q3, q4, q5, total_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, event_id, phase)
       DO UPDATE SET q1=$4, q2=$5, q3=$6, q4=$7, q5=$8, total_score=$9, submitted_at=NOW()`,
      [userId, eventId, phase, ...scores, total]
    );

    return {
      total_score: total,
      interpretation: total >= 52 ? 'بهزیستی خوب' : total >= 28 ? 'بهزیستی متوسط' : 'نیاز به توجه',
    };
  }

  async getMyResponse(userId: string, eventId: string, phase: 'pre' | 'post') {
    const [row] = await this.dataSource.query(
      `SELECT * FROM who5_responses WHERE user_id=$1 AND event_id=$2 AND phase=$3`,
      [userId, eventId, phase]
    );
    return row || null;
  }

  // تحلیل تغییر پیش/پس برای ادمین
  async getEventAnalysis(eventId: string) {
    const [result] = await this.dataSource.query(`
      SELECT
        AVG(CASE WHEN phase='pre' THEN total_score END)  as avg_pre,
        AVG(CASE WHEN phase='post' THEN total_score END) as avg_post,
        COUNT(DISTINCT CASE WHEN phase='pre' THEN user_id END)  as pre_count,
        COUNT(DISTINCT CASE WHEN phase='post' THEN user_id END) as post_count
      FROM who5_responses WHERE event_id=$1
    `, [eventId]);

    const delta = result.avg_post && result.avg_pre
      ? Number(result.avg_post) - Number(result.avg_pre)
      : null;

    return {
      avg_pre: result.avg_pre ? Math.round(Number(result.avg_pre)) : null,
      avg_post: result.avg_post ? Math.round(Number(result.avg_post)) : null,
      delta,
      delta_label: delta === null ? null : delta > 0 ? `+${delta.toFixed(1)} بهبود` : `${delta.toFixed(1)} کاهش`,
      pre_count: Number(result.pre_count),
      post_count: Number(result.post_count),
    };
  }
}
