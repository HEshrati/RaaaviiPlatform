import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PostFeedbackService {
  constructor(private readonly dataSource: DataSource) {}

  static readonly QUESTIONS = [
    { id: 'conversation_quality', label: 'کیفیت گفتگو چقدر بود؟' },
    { id: 'felt_safe',            label: 'چقدر احساس امنیت کردی؟' },
    { id: 'group_satisfaction',   label: 'از گروه چقدر راضی بودی؟' },
    { id: 'session_useful',       label: 'این جلسه چقدر برایت مفید بود؟' },
    { id: 'felt_heard',           label: 'آیا احساس کردی فرصت بیان خودت را داشتی؟' },
    { id: 'would_return',         label: 'آیا در رویداد مشابه شرکت می‌کنی؟' },
  ];

  async submit(userId: string, eventId: string, ratings: Record<string, number>, comment?: string) {
    const ids = PostFeedbackService.QUESTIONS.map(q => q.id);
    for (const id of ids) {
      if (!ratings[id] || ratings[id] < 1 || ratings[id] > 5) {
        throw new BadRequestException(`پاسخ به سوال ${id} الزامی است (۱ تا ۵)`);
      }
    }

    await this.dataSource.query(
      `INSERT INTO event_post_feedback
         (user_id, event_id, conversation_quality, felt_safe, group_satisfaction,
          session_useful, felt_heard, would_return, open_comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (user_id, event_id)
       DO UPDATE SET conversation_quality=$3, felt_safe=$4, group_satisfaction=$5,
                     session_useful=$6, felt_heard=$7, would_return=$8, open_comment=$9, submitted_at=NOW()`,
      [userId, eventId,
       ratings.conversation_quality, ratings.felt_safe, ratings.group_satisfaction,
       ratings.session_useful, ratings.felt_heard, ratings.would_return,
       comment || null]
    );

    return { submitted: true };
  }

  async hasSubmitted(userId: string, eventId: string) {
    const [row] = await this.dataSource.query(
      `SELECT id FROM event_post_feedback WHERE user_id=$1 AND event_id=$2`,
      [userId, eventId]
    );
    return !!row;
  }

  // آمار برای ادمین
  async getEventStats(eventId: string) {
    const [stats] = await this.dataSource.query(`
      SELECT
        COUNT(*) as total_responses,
        ROUND(AVG(conversation_quality),1) as avg_conversation,
        ROUND(AVG(felt_safe),1)            as avg_safety,
        ROUND(AVG(group_satisfaction),1)   as avg_group,
        ROUND(AVG(session_useful),1)       as avg_useful,
        ROUND(AVG(felt_heard),1)           as avg_heard,
        ROUND(AVG(would_return),1)         as avg_return,
        ROUND(AVG((conversation_quality+felt_safe+group_satisfaction+session_useful+felt_heard+would_return)/6.0),2) as overall_avg
      FROM event_post_feedback WHERE event_id=$1
    `, [eventId]);

    const comments = await this.dataSource.query(
      `SELECT open_comment FROM event_post_feedback WHERE event_id=$1 AND open_comment IS NOT NULL LIMIT 20`,
      [eventId]
    );

    return { ...stats, comments: comments.map((c: any) => c.open_comment) };
  }
}
