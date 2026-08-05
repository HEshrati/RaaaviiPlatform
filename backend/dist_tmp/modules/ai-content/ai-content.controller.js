"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiContentController = void 0;
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ai_content_service_1 = require("./ai-content.service");
const admin_controller_1 = require("../admin/admin.controller");
const typeorm_3 = require("@nestjs/typeorm");
const typeorm_4 = require("typeorm");
const ai_content_entity_1 = require("./entities/ai-content.entity");
let AiContentController = class AiContentController {
    constructor(ds, contentService, contentRepo) {
        this.ds = ds;
        this.contentService = contentService;
        this.contentRepo = contentRepo;
    }
    // ── عمومی: مقالات منتشرشده ────────────────────────────────────────
    async getPublished(page, limit, category, exclude) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 1000;
        const offset = (pageNum - 1) * limitNum;
        try {
            const ds = this.contentService.dataSource;
            if (ds) {
                const params = [];
                let sql = 'SELECT id,title,slug,summary,content,category,author,read_time,image_url,tags,created_at,view_count FROM articles WHERE is_published=true';
                if (category) {
                    params.push(category);
                    sql += ` AND category=$${params.length}`;
                }
                if (exclude) {
                    params.push(exclude);
                    sql += ` AND id!=$${params.length}`;
                }
                sql += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
                const rows = await ds.query(sql, params);
                if (rows && rows.length > 0)
                    return rows;
            }
        }
        catch (e) { }
        const articles = await this.contentService.getPublishedArticles(pageNum, limitNum);
        let list = Array.isArray(articles) ? articles : articles?.data || [];
        if (exclude)
            list = list.filter((a) => a.id !== exclude);
        if (category)
            list = list.filter((a) => a.category === category);
        return list;
    }
    async getOne(id) {
        // اول articles table
        try {
            const rows = await this.ds.query(`SELECT * FROM articles WHERE id=$1 AND is_published=true LIMIT 1`, [id]);
            if (rows && rows.length > 0) {
                await this.ds.query(`UPDATE articles SET view_count=COALESCE(view_count,0)+1 WHERE id=$1`, [id]).catch(() => { });
                return rows[0];
            }
        }
        catch (e) { }
        // بعد ai_content
        const content = await this.contentRepo.findOne({ where: { id } });
        if (!content)
            return { error: 'یافت نشد' };
        content.view_count = (content.view_count || 0) + 1;
        await this.contentRepo.save(content);
        return content;
    }
    // ── پشتیبانی هوشمند (عمومی) ──────────────────────────────────────
    async askSupport(body) {
        return this.contentService.answerSupportQuestion(body.question);
    }
    // ── ادمین: مدیریت محتوا ─────────────────────────────────────────
    async generateArticle(body, req) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('دسترسی ادمین لازم است');
        return this.contentService.generatePsychologicalArticle(body.topic, body.keywords, body.wordCount);
    }
    async getDrafts(req) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('دسترسی ادمین لازم است');
        return this.contentService.getDrafts();
    }
    async approve(id, req) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('دسترسی ادمین لازم است');
        return this.contentService.approveAndPublish(id, req.user.id);
    }
    async reject(id, body, req) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('دسترسی ادمین لازم است');
        return this.contentService.rejectContent(id, body.reason);
    }
    async edit(id, body, req) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('دسترسی ادمین لازم است');
        return this.contentService.editContent(id, body);
    }
    async scheduleWeekly(req) {
        if (!(0, admin_controller_1.isAdminUser)(req.user))
            throw new common_1.ForbiddenException('دسترسی ادمین لازم است');
        await this.contentService.scheduleWeeklyContent();
        return { success: true, message: 'تولید محتوای هفتگی شروع شد' };
    }
    async triggerDaily() {
        this.contentService.dailyArticleGeneration().catch(e => console.error(e));
        return { success: true, message: 'تولید مقاله روزانه شروع شد' };
    }
};
exports.AiContentController = AiContentController;
__decorate([
    (0, common_1.Get)('articles'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('exclude')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AiContentController.prototype, "getPublished", null);
__decorate([
    (0, common_1.Get)('articles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiContentController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)('support/ask'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiContentController.prototype, "askSupport", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('admin/generate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiContentController.prototype, "generateArticle", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('admin/drafts'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiContentController.prototype, "getDrafts", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('admin/approve/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiContentController.prototype, "approve", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('admin/reject/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiContentController.prototype, "reject", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('admin/edit/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AiContentController.prototype, "edit", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('admin/schedule-weekly'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiContentController.prototype, "scheduleWeekly", null);
__decorate([
    (0, common_1.Post)('admin/trigger-daily'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiContentController.prototype, "triggerDaily", null);
exports.AiContentController = AiContentController = __decorate([
    (0, common_1.Controller)('content'),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __param(2, (0, typeorm_3.InjectRepository)(ai_content_entity_1.AiContent)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        ai_content_service_1.AiContentService,
        typeorm_4.Repository])
], AiContentController);
