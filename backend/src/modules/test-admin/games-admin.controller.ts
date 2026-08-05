import { BadRequestException, Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { isAdminUser } from '../admin/admin.controller';
import { mutationRows } from '../../common/database/query-result';

function requireAdmin(user: any) {
  if (!isAdminUser(user))
    throw new ForbiddenException('دسترسی ادمین لازم است');
}

@Controller('admin/games')
@UseGuards(JwtAuthGuard)
export class GamesAdminController {
  constructor(@InjectDataSource() private ds: DataSource) {}

  /** لیست همه بازی‌ها */
  @Get()
  async getGames(@Req() req: any) {
    requireAdmin(req.user);
    return this.ds.query(`
      SELECT eq.*, eq.settings->>'description' AS description,
             e.title AS event_title, e.start_date
      FROM event_quizzes eq
      LEFT JOIN events e ON e.id = eq.event_id
      ORDER BY eq.created_at DESC
    `);
  }

  /** بازی‌های یک ایونت */
  @Get('event/:eventId')
  async getEventGames(@Req() req: any, @Param('eventId') eventId: string) {
    requireAdmin(req.user);
    return this.ds.query(
      `SELECT eq.*, eq.settings->>'description' AS description
       FROM event_quizzes eq WHERE event_id=$1 ORDER BY created_at DESC`,
      [eventId]
    );
  }

  /** ایجاد بازی جدید */
  @Post()
  async createGame(@Req() req: any, @Body() body: any) {
    requireAdmin(req.user);
    if (!body.event_id) throw new BadRequestException('انتخاب رویداد الزامی است');
    if (!body.title?.trim()) throw new BadRequestException('عنوان بازی الزامی است');
    const questions = normalizeQuestions(body.questions);
    const [game] = await this.ds.query(`
      INSERT INTO event_quizzes (event_id, game_type, title, questions, settings, is_active)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [body.event_id, body.game_type||'quiz', body.title.trim(),
        JSON.stringify(questions), JSON.stringify({ description: body.description||'' }),
        body.is_active ?? true]);
    return game;
  }

  /** ویرایش بازی */
  @Put(':id')
  async updateGame(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    requireAdmin(req.user);
    if (!body.event_id) throw new BadRequestException('انتخاب رویداد الزامی است');
    const result = await this.ds.query(`
      UPDATE event_quizzes SET
        event_id=$1, title=$2, questions=$3, settings=$4,
        is_active=$5, game_type=$6, updated_at=NOW()
      WHERE id=$7 RETURNING *
    `, [body.event_id, body.title?.trim(), JSON.stringify(normalizeQuestions(body.questions)),
        JSON.stringify({ ...(body.settings || {}), description: body.description||'' }),
        body.is_active??true, body.game_type||'quiz', id]);
    const [game] = mutationRows<any>(result);
    if (!game) throw new BadRequestException('بازی پیدا نشد');
    return game;
  }

  /** حذف بازی */
  @Delete(':id')
  async deleteGame(@Req() req: any, @Param('id') id: string) {
    requireAdmin(req.user);
    const result = await this.ds.query('DELETE FROM event_quizzes WHERE id=$1 RETURNING id', [id]);
    return { success: mutationRows(result).length === 1 };
  }

  /** لیست ایونت‌ها برای dropdown */
  @Get('events-list')
  async eventsList(@Req() req: any) {
    requireAdmin(req.user);
    return this.ds.query(
      'SELECT id, title, start_date FROM events ORDER BY start_date DESC LIMIT 20'
    );
  }
}

function normalizeQuestions(value: unknown): any[] {
  if (!Array.isArray(value) || !value.length) {
    throw new BadRequestException('حداقل یک سؤال لازم است');
  }
  return value.map((question: any, index) => {
    if (!question?.question?.trim() || !Array.isArray(question.options) || question.options.length < 2) {
      throw new BadRequestException(`سؤال ${index + 1} کامل نیست`);
    }
    const correct = Number(question.correct_answer ?? question.correct ?? 0);
    if (!Number.isInteger(correct) || correct < 0 || correct >= question.options.length) {
      throw new BadRequestException(`پاسخ صحیح سؤال ${index + 1} معتبر نیست`);
    }
    return {
      ...question,
      id: question.id ?? index + 1,
      question: question.question.trim(),
      options: question.options.map((option: unknown) => String(option).trim()),
      correct_answer: correct,
    };
  });
}
