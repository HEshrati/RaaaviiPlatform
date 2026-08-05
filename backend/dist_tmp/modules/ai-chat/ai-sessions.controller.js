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
exports.AiSessionsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AiSessionsController = class AiSessionsController {
    constructor(ds) {
        this.ds = ds;
    }
    /** لیست همه sessions کاربر */
    async getSessions(req) {
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
    async createSession(req, body) {
        const rows = await this.ds.query(`
      INSERT INTO ai_chat_sessions (user_id, title)
      VALUES ($1, $2) RETURNING id, title, created_at
    `, [req.user.id, body.title || 'چت جدید']);
        return rows[0];
    }
    /** دریافت پیام‌های یک session */
    async getMessages(req, id) {
        // بررسی ownership
        const session = await this.ds.query('SELECT id FROM ai_chat_sessions WHERE id=$1 AND user_id=$2', [id, req.user.id]);
        if (!session?.length)
            return { error: 'not found' };
        const messages = await this.ds.query('SELECT id, role, content, created_at FROM ai_chat_messages WHERE session_id=$1 ORDER BY created_at ASC', [id]);
        return { messages };
    }
    /** ذخیره پیام در session */
    async addMessage(req, id, body) {
        await this.ds.query(`
      INSERT INTO ai_chat_messages (session_id, role, content)
      VALUES ($1, $2, $3)
    `, [id, body.role, body.content]);
        // آپدیت عنوان session اگه اولین پیامه
        const count = await this.ds.query('SELECT COUNT(*) FROM ai_chat_messages WHERE session_id=$1', [id]);
        if (Number(count[0].count) <= 2 && body.role === 'user') {
            const title = body.content.slice(0, 40) + (body.content.length > 40 ? '...' : '');
            await this.ds.query('UPDATE ai_chat_sessions SET title=$1, updated_at=NOW() WHERE id=$2', [title, id]);
        }
        else {
            await this.ds.query('UPDATE ai_chat_sessions SET updated_at=NOW() WHERE id=$1', [id]);
        }
        return { success: true };
    }
    /** تغییر نام session */
    async updateSession(req, id, body) {
        await this.ds.query('UPDATE ai_chat_sessions SET title=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3', [body.title, id, req.user.id]);
        return { success: true };
    }
    /** حذف session */
    async deleteSession(req, id) {
        await this.ds.query('DELETE FROM ai_chat_sessions WHERE id=$1 AND user_id=$2', [id, req.user.id]);
        return { success: true };
    }
};
exports.AiSessionsController = AiSessionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiSessionsController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiSessionsController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiSessionsController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AiSessionsController.prototype, "addMessage", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AiSessionsController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiSessionsController.prototype, "deleteSession", null);
exports.AiSessionsController = AiSessionsController = __decorate([
    (0, common_1.Controller)('ai-chat/sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], AiSessionsController);
