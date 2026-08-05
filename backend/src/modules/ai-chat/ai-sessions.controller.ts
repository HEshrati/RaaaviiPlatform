import { Controller, Get, Post, Delete, Patch, Param, Body, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai-chat/sessions')
@UseGuards(JwtAuthGuard)
export class AiSessionsController {
  constructor(@InjectDataSource() private ds: DataSource) {}

  /** لیست همه sessions کاربر */
  @Get()
  async getSessions(@Req() req: any) {
    return this.ds.query(`
      SELECT s.id, s.title, s.created_at, s.updated_at,
        (SELECT content FROM ai_chat_messages
         WHERE session_id=s.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM ai_chat_sessions s
      WHERE s.user_id=$1 AND s.is_archived=false
      ORDER BY s.updated_at DESC
      LIMIT 50
    `, [req.user.id]);
  }

  /** ساخت session جدید */
  @Post()
  async createSession(@Req() req: any, @Body() body: { title?: string }) {
    const rows = await this.ds.query(`
      INSERT INTO ai_chat_sessions (user_id, title)
      VALUES ($1, $2) RETURNING id, title, created_at
    `, [req.user.id, body.title || 'چت جدید']);
    return rows[0];
  }

  /** دریافت پیام‌های یک session */
  @Get(':id/messages')
  async getMessages(@Req() req: any, @Param('id') id: string) {
    // بررسی ownership
    const session = await this.ds.query(
      'SELECT id FROM ai_chat_sessions WHERE id=$1 AND user_id=$2', [id, req.user.id]
    );
    if (!session?.length) return { error: 'not found' };

    const messages = await this.ds.query(
      'SELECT id, role, content, created_at FROM ai_chat_messages WHERE session_id=$1 ORDER BY created_at ASC',
      [id]
    );
    return { messages };
  }

  /** ذخیره پیام در session */
  @Post(':id/messages')
  async addMessage(@Req() req: any, @Param('id') id: string, @Body() body: { role: string; content: string }) {
    const owned = await this.ds.query(
      'SELECT id FROM ai_chat_sessions WHERE id=$1 AND user_id=$2 AND is_archived=false',
      [id, req.user.id],
    );
    if (!owned.length) throw new NotFoundException('گفتگو یافت نشد');
    await this.ds.query(`
      INSERT INTO ai_chat_messages (session_id, role, content)
      VALUES ($1, $2, $3)
    `, [id, body.role, body.content]);

    // آپدیت عنوان session اگه اولین پیامه
    const count = await this.ds.query(
      'SELECT COUNT(*) FROM ai_chat_messages WHERE session_id=$1', [id]
    );
    if (Number(count[0].count) <= 2 && body.role === 'user') {
      const title = body.content.slice(0, 40) + (body.content.length > 40 ? '...' : '');
      await this.ds.query(
        'UPDATE ai_chat_sessions SET title=$1, updated_at=NOW() WHERE id=$2',
        [title, id]
      );
    } else {
      await this.ds.query(
        'UPDATE ai_chat_sessions SET updated_at=NOW() WHERE id=$1', [id]
      );
    }
    return { success: true };
  }

  /** تغییر نام session */
  @Patch(':id')
  async updateSession(@Req() req: any, @Param('id') id: string, @Body() body: { title: string }) {
    await this.ds.query(
      'UPDATE ai_chat_sessions SET title=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3',
      [body.title, id, req.user.id]
    );
    return { success: true };
  }

  /** حذف session */
  @Delete(':id')
  async deleteSession(@Req() req: any, @Param('id') id: string) {
    await this.ds.query(
      'DELETE FROM ai_chat_sessions WHERE id=$1 AND user_id=$2', [id, req.user.id]
    );
    return { success: true };
  }
}
