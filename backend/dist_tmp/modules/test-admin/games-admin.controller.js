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
exports.GamesAdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_2 = require("@nestjs/common");
const ADMIN_PHONES = ['09356815523', '09929564895', '09933830958'];
function requireAdmin(user) {
    const raw = user?.mobileNumber || user?.phone_number || '';
    const phone = String(raw).replace(/^98/, '0').replace(/^\+98/, '0');
    if (!ADMIN_PHONES.includes(phone) && user?.role !== 'admin')
        throw new common_2.ForbiddenException('دسترسی ادمین لازم است');
}
let GamesAdminController = class GamesAdminController {
    constructor(ds) {
        this.ds = ds;
    }
    /** لیست همه بازی‌ها */
    async getGames(req) {
        requireAdmin(req.user);
        return this.ds.query(`
      SELECT eg.*, e.title as event_title, e.start_date
      FROM event_games eg
      LEFT JOIN events e ON e.id = eg.event_id
      ORDER BY eg.created_at DESC
    `);
    }
    /** بازی‌های یک ایونت */
    async getEventGames(req, eventId) {
        requireAdmin(req.user);
        return this.ds.query('SELECT * FROM event_games WHERE event_id=$1 ORDER BY created_at DESC', [eventId]);
    }
    /** ایجاد بازی جدید */
    async createGame(req, body) {
        requireAdmin(req.user);
        const phone = req.user?.mobileNumber || req.user?.phone_number || '';
        const [game] = await this.ds.query(`
      INSERT INTO event_games (event_id, game_type, title, description, questions, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [body.event_id || null, body.game_type || 'quiz',
            body.title, body.description || '',
            JSON.stringify(body.questions || []), phone]);
        return game;
    }
    /** ویرایش بازی */
    async updateGame(req, id, body) {
        requireAdmin(req.user);
        await this.ds.query(`
      UPDATE event_games SET
        title=$1, description=$2, questions=$3,
        is_active=$4, game_type=$5, updated_at=NOW()
      WHERE id=$6
    `, [body.title, body.description, JSON.stringify(body.questions || []),
            body.is_active ?? true, body.game_type || 'quiz', id]);
        return { success: true };
    }
    /** حذف بازی */
    async deleteGame(req, id) {
        requireAdmin(req.user);
        await this.ds.query('DELETE FROM event_games WHERE id=$1', [id]);
        return { success: true };
    }
    /** لیست ایونت‌ها برای dropdown */
    async eventsList(req) {
        requireAdmin(req.user);
        return this.ds.query('SELECT id, title, start_date FROM events ORDER BY start_date DESC LIMIT 20');
    }
};
exports.GamesAdminController = GamesAdminController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GamesAdminController.prototype, "getGames", null);
__decorate([
    (0, common_1.Get)('event/:eventId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GamesAdminController.prototype, "getEventGames", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GamesAdminController.prototype, "createGame", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], GamesAdminController.prototype, "updateGame", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GamesAdminController.prototype, "deleteGame", null);
__decorate([
    (0, common_1.Get)('events-list'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GamesAdminController.prototype, "eventsList", null);
exports.GamesAdminController = GamesAdminController = __decorate([
    (0, common_1.Controller)('admin/games'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], GamesAdminController);
