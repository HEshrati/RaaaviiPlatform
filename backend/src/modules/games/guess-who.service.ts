import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getQuestionsForGroup, AVATARS } from './guess-who-questions';
import { mutationRows } from '../../common/database/query-result';

@Injectable()
export class GuessWhoService {
  constructor(private readonly dataSource: DataSource) {}

  // ── ایجاد یا بازیابی session برای رویداد ──────────────────
  async getOrCreateSession(eventId: string, groupProfile = 'default') {
    const existing = await this.dataSource.query(
      `SELECT * FROM guess_who_sessions WHERE event_id=$1 AND status != 'finished' LIMIT 1`,
      [eventId]
    );
    if (existing[0]) return existing[0];

    const questions = getQuestionsForGroup(groupProfile, 5);
    const [session] = await this.dataSource.query(
      `INSERT INTO guess_who_sessions (event_id, group_profile, total_rounds)
       VALUES ($1, $2, $3) RETURNING *`,
      [eventId, groupProfile, questions.length]
    );

    // از قبل دورها رو بساز
    for (let i = 0; i < questions.length; i++) {
      await this.dataSource.query(
        `INSERT INTO guess_who_rounds (session_id, round_number, question, question_type)
         VALUES ($1, $2, $3, $4)`,
        [session.id, i + 1, questions[i].text, questions[i].type]
      );
    }

    return session;
  }

  // ── شروع بازی (ادمین یا زمان خودکار) ──────────────────────
  async startSession(sessionId: string) {
    await this.dataSource.query(
      `UPDATE guess_who_sessions SET status='active', started_at=NOW(), current_round=1 WHERE id=$1`,
      [sessionId]
    );
    return this.startRound(sessionId, 1);
  }

  // ── شروع دور جدید ──────────────────────────────────────────
  async startRound(sessionId: string, roundNumber: number) {
    const answerDeadline = new Date(Date.now() + 20_000); // 20 ثانیه برای پاسخ
    const [round] = mutationRows<any>(await this.dataSource.query(
      `UPDATE guess_who_rounds
       SET status='answering', answer_deadline=$1
       WHERE session_id=$2 AND round_number=$3
       RETURNING *`,
      [answerDeadline, sessionId, roundNumber]
    ));
    if (!round) throw new NotFoundException('دور پیدا نشد');
    return { round, answer_deadline: answerDeadline };
  }

  // ── ثبت پاسخ کاربر (ناشناس) ────────────────────────────────
  async submitAnswer(roundId: string, userId: string, answer: string) {
    const [round] = await this.dataSource.query(
      `SELECT * FROM guess_who_rounds WHERE id=$1`, [roundId]
    );
    if (!round) throw new NotFoundException('دور پیدا نشد');
    if (round.status !== 'answering') throw new BadRequestException('زمان پاسخ تمام شده');

    // آواتار اختصاص بده (بر اساس ترتیب ورود)
    const existing = await this.dataSource.query(
      `SELECT COUNT(*) as cnt FROM guess_who_answers WHERE round_id=$1`, [roundId]
    );
    const avatarIndex = parseInt(existing[0].cnt) % AVATARS.length;
    const avatarName = AVATARS[avatarIndex];

    await this.dataSource.query(
      `INSERT INTO guess_who_answers (round_id, user_id, avatar_name, answer)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (round_id, user_id) DO UPDATE SET answer=$4`,
      [roundId, userId, avatarName, answer]
    );

    return { avatar: avatarName, submitted: true };
  }

  // ── انتخاب پاسخ تصادفی و شروع فاز حدس ───────────────────
  async closeAnswersAndStartGuessing(roundId: string) {
    const answers = await this.dataSource.query(
      `SELECT * FROM guess_who_answers WHERE round_id=$1`, [roundId]
    );
    if (!answers.length) throw new BadRequestException('هیچ پاسخی ثبت نشده');

    // انتخاب تصادفی
    const selected = answers[Math.floor(Math.random() * answers.length)];
    const guessDeadline = new Date(Date.now() + 15_000); // 15 ثانیه برای حدس

    const [round] = mutationRows<any>(await this.dataSource.query(
      `UPDATE guess_who_rounds
       SET status='guessing', selected_answer=$1, answer_owner_id=$2, guess_deadline=$3
       WHERE id=$4
       RETURNING *`,
      [selected.answer, selected.user_id, guessDeadline, roundId]
    ));
    if (!round) throw new NotFoundException('دور پیدا نشد');

    return {
      round,
      selected_answer: selected.answer,
      avatars: answers.map((a: any) => a.avatar_name),
      guess_deadline: guessDeadline,
    };
  }

  // ── ثبت حدس کاربر ──────────────────────────────────────────
  async submitGuess(roundId: string, userId: string, guessedAvatar: string) {
    const [round] = await this.dataSource.query(
      `SELECT r.*, a.avatar_name as owner_avatar
       FROM guess_who_rounds r
       LEFT JOIN guess_who_answers a ON a.round_id=r.id AND a.user_id=r.answer_owner_id
       WHERE r.id=$1`, [roundId]
    );
    if (!round) throw new NotFoundException('دور پیدا نشد');
    if (round.status !== 'guessing') throw new BadRequestException('زمان حدس تمام شده');

    // آنتی self-selection: صاحب پاسخ نمی‌تواند حدس بزند
    if (round.answer_owner_id === userId) {
      throw new BadRequestException('نمی‌توانی به پاسخ خودت حدس بزنی');
    }

    const isCorrect = guessedAvatar === round.owner_avatar;
    const points = isCorrect ? 10 : 0;

    await this.dataSource.query(
      `INSERT INTO guess_who_guesses (round_id, user_id, guessed_avatar, is_correct, points)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (round_id, user_id) DO UPDATE SET guessed_avatar=$3, is_correct=$4, points=$5`,
      [roundId, userId, guessedAvatar, isCorrect, points]
    );

    return { submitted: true, is_correct: isCorrect };
  }

  // ── اعلام نتیجه دور ────────────────────────────────────────
  async revealRound(roundId: string) {
    const [round] = await this.dataSource.query(
      `SELECT r.*, a.avatar_name as owner_avatar, a.user_id as owner_id
       FROM guess_who_rounds r
       LEFT JOIN guess_who_answers a ON a.round_id=r.id AND a.user_id=r.answer_owner_id
       WHERE r.id=$1`, [roundId]
    );

    const guesses = await this.dataSource.query(
      `SELECT g.*, a.answer as user_answer
       FROM guess_who_guesses g
       LEFT JOIN guess_who_answers a ON a.round_id=g.round_id AND a.user_id=g.user_id
       WHERE g.round_id=$1`, [roundId]
    );

    // آپدیت امتیاز کل session
    const sessionId = (await this.dataSource.query(
      `SELECT session_id FROM guess_who_rounds WHERE id=$1`, [roundId]
    ))[0]?.session_id;

    for (const g of guesses) {
      if (g.points > 0) {
        await this.dataSource.query(
          `INSERT INTO guess_who_scores (session_id, user_id, avatar_name, total_points, correct_guesses)
           VALUES ($1, $2, (SELECT avatar_name FROM guess_who_answers WHERE round_id=$3 AND user_id=$2), $4, 1)
           ON CONFLICT (session_id, user_id)
           DO UPDATE SET total_points=guess_who_scores.total_points+$4,
                         correct_guesses=guess_who_scores.correct_guesses+1`,
          [sessionId, g.user_id, roundId, g.points]
        );
      }
    }

    await this.dataSource.query(
      `UPDATE guess_who_rounds SET status='revealed' WHERE id=$1`, [roundId]
    );

    const winners = guesses.filter((g: any) => g.is_correct).map((g: any) => g.guessed_avatar);

    return {
      answer: round.selected_answer,
      owner_avatar: round.owner_avatar,
      winners,
      guesses: guesses.map((g: any) => ({
        avatar: g.guessed_avatar,
        is_correct: g.is_correct,
        points: g.points,
      })),
    };
  }

  // ── پیشرفت به دور بعدی یا پایان بازی ──────────────────────
  async nextRound(sessionId: string) {
    const [session] = mutationRows<any>(await this.dataSource.query(
      `UPDATE guess_who_sessions SET current_round=current_round+1 WHERE id=$1 RETURNING *`,
      [sessionId]
    ));
    if (!session) throw new NotFoundException('بازی پیدا نشد');

    if (session.current_round > session.total_rounds) {
      return this.finishSession(sessionId);
    }

    return this.startRound(sessionId, session.current_round);
  }

  // ── پایان بازی و نتایج نهایی ───────────────────────────────
  async finishSession(sessionId: string) {
    await this.dataSource.query(
      `UPDATE guess_who_sessions SET status='finished', finished_at=NOW() WHERE id=$1`,
      [sessionId]
    );

    const scores = await this.dataSource.query(
      `SELECT * FROM guess_who_scores WHERE session_id=$1 ORDER BY total_points DESC`,
      [sessionId]
    );

    // بررسی جایزه گروهی (80% مشارکت)
    const [session] = await this.dataSource.query(
      `SELECT s.*, COUNT(DISTINCT sc.user_id) as participants
       FROM guess_who_sessions s
       LEFT JOIN guess_who_scores sc ON sc.session_id=s.id
       WHERE s.id=$1 GROUP BY s.id`, [sessionId]
    );

    // تعداد کاربران ثبت‌نام کرده در رویداد
    const [bookingCount] = await this.dataSource.query(
      `SELECT COUNT(*) as cnt FROM bookings WHERE event_id=$1 AND status='confirmed'`,
      [session.event_id]
    );

    const participationRate = parseInt(session.participants) / Math.max(1, parseInt(bookingCount.cnt));
    const groupReward = participationRate >= 0.8;

    return {
      finished: true,
      scores,
      group_reward: groupReward,
      group_reward_message: groupReward
        ? '🎉 همه با هم شرکت کردید! کد تخفیف ۵٪ برای رویداد بعدی برای همه فعال شد.'
        : null,
      conversation_prompt: 'حالا که کمی با سلیقه هم آشنا شدیم، می‌توانید درباره یکی از پاسخ‌های جالب گفتگو کنید.',
    };
  }

  // ── وضعیت فعلی session برای کاربر ─────────────────────────
  async getSessionState(eventId: string, userId: string) {
    const [session] = await this.dataSource.query(
      `SELECT * FROM guess_who_sessions WHERE event_id=$1 AND status != 'finished' LIMIT 1`,
      [eventId]
    );
    if (!session) return null;

    const [currentRound] = await this.dataSource.query(
      `SELECT r.*,
              a.avatar_name as my_avatar,
              a.answer as my_answer,
              g.guessed_avatar as my_guess,
              g.is_correct as my_guess_correct
       FROM guess_who_rounds r
       LEFT JOIN guess_who_answers a ON a.round_id=r.id AND a.user_id=$2
       LEFT JOIN guess_who_guesses g ON g.round_id=r.id AND g.user_id=$2
       WHERE r.session_id=$1 AND r.round_number=$3`,
      [session.id, userId, session.current_round]
    );

    const myScore = await this.dataSource.query(
      `SELECT total_points, correct_guesses FROM guess_who_scores WHERE session_id=$1 AND user_id=$2`,
      [session.id, userId]
    );

    const leaderboard = await this.dataSource.query(
      `SELECT avatar_name, total_points FROM guess_who_scores WHERE session_id=$1 ORDER BY total_points DESC LIMIT 5`,
      [session.id]
    );

    return {
      session,
      current_round: currentRound || null,
      my_score: myScore[0] || { total_points: 0, correct_guesses: 0 },
      leaderboard,
    };
  }
}
