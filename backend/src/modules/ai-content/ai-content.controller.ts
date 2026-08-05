import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, Req, ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiContentService } from './ai-content.service';
import { isAdminUser } from '../admin/admin.controller';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiContent } from './entities/ai-content.entity';

@Controller('content')
export class AiContentController {
  constructor(@InjectDataSource() private readonly ds: DataSource,
    private readonly contentService: AiContentService,
    @InjectRepository(AiContent)
    private readonly contentRepo: Repository<AiContent>,
  ) {}

  // ── عمومی: مقالات منتشرشده ────────────────────────────────────────
  @Get('articles')
  async getPublished(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('category') category: string,
    @Query('exclude') exclude: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 1000;
    const offset = (pageNum - 1) * limitNum;
    try {
      const ds = (this.contentService as any).dataSource;
      if (ds) {
        const params: any[] = [];
        let sql = 'SELECT id,title,slug,summary,content,category,author,read_time,image_url,tags,created_at,view_count FROM articles WHERE is_published=true';
        if (category) { params.push(category); sql += ` AND category=$${params.length}`; }
        if (exclude) { params.push(exclude); sql += ` AND id!=$${params.length}`; }
        sql += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
        const rows = await ds.query(sql, params);
        if (rows && rows.length > 0) return rows;
      }
    } catch (e) {  }
    const articles = await this.contentService.getPublishedArticles(pageNum, limitNum);
    let list = Array.isArray(articles) ? articles : (articles as any)?.data || [];
    if (exclude) list = list.filter((a: any) => a.id !== exclude);
    if (category) list = list.filter((a: any) => a.category === category);
    return list;
  }
  @Get('articles/:id')
  async getOne(@Param('id') id: string) {
    // اول articles table
    try {
      const rows = await this.ds.query(
        `SELECT * FROM articles WHERE id=$1 AND is_published=true LIMIT 1`, [id]
      );
      if (rows && rows.length > 0) {
        await this.ds.query(
          `UPDATE articles SET view_count=COALESCE(view_count,0)+1 WHERE id=$1`, [id]
        ).catch(()=>{});
        return rows[0];
      }
    } catch(e) {}
    // بعد ai_content
    const content = await this.contentRepo.findOne({ where: { id } as any });
    if (!content) return { error: 'یافت نشد' };
    content.view_count = (content.view_count || 0) + 1;
    await this.contentRepo.save(content);
    return content;
  }

  // ── پشتیبانی هوشمند (عمومی) ──────────────────────────────────────
  @Post('support/ask')
  async askSupport(@Body() body: { question: string }) {
    return this.contentService.answerSupportQuestion(body.question);
  }

  // ── ادمین: مدیریت محتوا ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('admin/generate')
  async generateArticle(
    @Body() body: { topic?: string; keywords?: string[]; wordCount?: number },
    @Req() req: any,
  ) {
    if (!isAdminUser(req.user)) throw new ForbiddenException('دسترسی ادمین لازم است');
    return this.contentService.generatePsychologicalArticle(body.topic, body.keywords, body.wordCount);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/drafts')
  async getDrafts(@Req() req: any) {
    if (!isAdminUser(req.user)) throw new ForbiddenException('دسترسی ادمین لازم است');
    return this.contentService.getDrafts();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/approve/:id')
  async approve(@Param('id') id: string, @Req() req: any) {
    if (!isAdminUser(req.user)) throw new ForbiddenException('دسترسی ادمین لازم است');
    return this.contentService.approveAndPublish(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/reject/:id')
  async reject(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    if (!isAdminUser(req.user)) throw new ForbiddenException('دسترسی ادمین لازم است');
    return this.contentService.rejectContent(id, body.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/edit/:id')
  async edit(
    @Param('id') id: string,
    @Body() body: { title?: string; body?: string; summary?: string },
    @Req() req: any,
  ) {
    if (!isAdminUser(req.user)) throw new ForbiddenException('دسترسی ادمین لازم است');
    return this.contentService.editContent(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/schedule-weekly')
  async scheduleWeekly(@Req() req: any) {
    if (!isAdminUser(req.user)) throw new ForbiddenException('دسترسی ادمین لازم است');
    await this.contentService.scheduleWeeklyContent();
    return { success: true, message: 'تولید محتوای هفتگی شروع شد' };
  }

  @Post('admin/trigger-daily')
  @UseGuards(JwtAuthGuard)
  async triggerDaily(@Req() req: any) {
    if (!isAdminUser(req.user)) throw new ForbiddenException('دسترسی ادمین لازم است');
    this.contentService.dailyArticleGeneration().catch(e => console.error(e));
    return { success: true, message: 'تولید مقاله روزانه شروع شد' };
  }
}