import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventQuiz, QuizQuestion } from './entities/event-quiz.entity';
import { QuizResult } from './entities/quiz-result.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(EventQuiz)
    private quizRepo: Repository<EventQuiz>,
    @InjectRepository(QuizResult)
    private resultRepo: Repository<QuizResult>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  async createQuiz(eventId: string, title: string, questions: QuizQuestion[], game_type: string = 'icebreaker', settings?: any): Promise<EventQuiz> {
    const quiz = this.quizRepo.create({ event_id: eventId, title, questions, game_type, settings });
    return this.quizRepo.save(quiz);
  }

  async updateQuiz(quizId: string, data: Partial<EventQuiz>): Promise<EventQuiz> {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('کوییز پیدا نشد');
    Object.assign(quiz, data);
    return this.quizRepo.save(quiz);
  }

  async getQuizByEvent(eventId: string): Promise<any | null> {
    const quiz = await this.quizRepo.findOne({ where: { event_id: eventId, is_active: true } });
    if (!quiz) return null;
    // سوال‌ها بدون پاسخ درست
    return {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        // correct_answer حذف می‌شه
      })),
    };
  }

  async getMyQuizzes(userId: string) {
    const bookings = await this.bookingRepo.find({
      where: { user_id: userId, status: In(['confirmed', 'completed']) },
      select: { event_id: true },
    });
    const eventIds = [...new Set(bookings.map((booking) => booking.event_id))];
    if (!eventIds.length) {
      return { quizzes: [], message: 'برای دیدن بازی‌ها باید همنشینی رزرو کنید' };
    }

    const quizzes = await this.quizRepo.find({
      where: { event_id: In(eventIds), is_active: true },
      order: { created_at: 'DESC' },
    });
    const results = quizzes.length
      ? await this.resultRepo.find({
          where: { user_id: userId, quiz_id: In(quizzes.map((quiz) => quiz.id)) },
        })
      : [];
    const resultByQuiz = new Map(results.map((result) => [result.quiz_id, result]));

    return {
      quizzes: quizzes.map((quiz) => ({
        ...quiz,
        questions: quiz.questions.map(({ correct_answer, explanation, ...question }) => question),
        result: resultByQuiz.get(quiz.id) || null,
      })),
    };
  }

  async assertEventAccess(eventId: string, userId: string): Promise<void> {
    const booking = await this.bookingRepo.findOne({
      where: { event_id: eventId, user_id: userId, status: In(['confirmed', 'completed']) },
      select: { id: true },
    });
    if (!booking) throw new ForbiddenException('این بازی فقط برای شرکت‌کنندگان رویداد در دسترس است');
  }

  async assertQuizAccess(quizId: string, userId: string): Promise<EventQuiz> {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId, is_active: true } });
    if (!quiz) throw new NotFoundException('کوییز پیدا نشد');
    await this.assertEventAccess(quiz.event_id, userId);
    return quiz;
  }

  async submitQuiz(quizId: string, userId: string, answers: number[]): Promise<{
    score: number;
    total: number;
    correct_answers: number[];
    explanations: string[];
  }> {
    const quiz = await this.assertQuizAccess(quizId, userId);
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      throw new ForbiddenException('پاسخ همه سؤال‌ها باید ارسال شود');
    }

    let score = 0;
    const correct_answers: number[] = [];
    const explanations: string[] = [];

    quiz.questions.forEach((q, idx) => {
      correct_answers.push(q.correct_answer);
      explanations.push(q.explanation || '');
      if (answers[idx] === q.correct_answer) score++;
    });

    // ذخیره نتیجه (یک بار)
    await this.resultRepo.createQueryBuilder()
      .insert()
      .values({
        quiz_id: quizId, user_id: userId, event_id: quiz.event_id,
        score, total_questions: quiz.questions.length, answers,
      })
      .orIgnore()
      .execute();

    return { score, total: quiz.questions.length, correct_answers, explanations };
  }

  async getLeaderboard(quizId: string): Promise<QuizResult[]> {
    return this.resultRepo.find({
      where: { quiz_id: quizId },
      order: { score: 'DESC', completed_at: 'ASC' },
      take: 10,
    });
  }
}
