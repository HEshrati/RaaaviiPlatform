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
exports.TestAdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_2 = require("@nestjs/common");
const ADMIN_PHONES = ['09356815523', '09929564895', '09933830958'];
function requireAdmin(user) {
    const raw = user?.mobileNumber || user?.phone_number || user?.mobile || '';
    const phone = String(raw).replace(/^98/, '0').replace(/^\+98/, '0');
    const isAdmin = ADMIN_PHONES.includes(phone) ||
        user?.role === 'admin' || user?.role === 'superadmin' ||
        user?.isAdmin === true;
    if (!isAdmin)
        throw new common_2.ForbiddenException('دسترسی ادمین لازم است');
}
let TestAdminController = class TestAdminController {
    constructor(ds) {
        this.ds = ds;
    }
    /** لیست همه تست‌ها با وضعیت DB */
    async getTests(req) {
        requireAdmin(req.user);
        const configs = await this.ds.query('SELECT * FROM test_configurations ORDER BY created_at DESC');
        const configMap = Object.fromEntries(configs.map((c) => [c.test_id, c]));
        // آمار از test_results
        const stats = await this.ds.query(`
      SELECT test_name, COUNT(*) as count, COUNT(DISTINCT user_id) as users
      FROM test_results GROUP BY test_name ORDER BY count DESC
    `);
        const statMap = Object.fromEntries(stats.map((s) => [s.test_name, s]));
        return { configs, statMap, configMap };
    }
    /** جزئیات یک تست */
    /** آنالیز کامل تست‌ها برای dashboard */
    async analytics(req) {
        requireAdmin(req.user);
        const [perTest, daily, resultDist, topUsers] = await Promise.all([
            // آمار هر تست
            this.ds.query(`
        SELECT
          test_name,
          COUNT(*)::int as total,
          COUNT(DISTINCT user_id)::int as unique_users,
          ROUND(AVG((scores->>'total')::numeric), 1) as avg_score,
          MIN(created_at) as first_taken,
          MAX(created_at) as last_taken,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END)::int as last_7_days,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END)::int as last_30_days
        FROM test_results
        GROUP BY test_name
        ORDER BY total DESC
      `),
            // روزانه ۳۰ روز اخیر
            this.ds.query(`
        SELECT
          DATE(created_at) as date,
          test_name,
          COUNT(*)::int as count
        FROM test_results
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at), test_name
        ORDER BY date DESC
      `),
            // توزیع نتایج هر تست
            this.ds.query(`
        SELECT test_name, main_result, COUNT(*)::int as count
        FROM test_results
        WHERE main_result IS NOT NULL AND main_result != 'completed'
        GROUP BY test_name, main_result
        ORDER BY test_name, count DESC
      `),
            // کاربران با بیشترین تست
            this.ds.query(`
        SELECT u.name, u.phone_number,
          COUNT(tr.id)::int as total_tests,
          COUNT(DISTINCT tr.test_name)::int as unique_tests,
          MAX(tr.created_at) as last_activity
        FROM test_results tr
        JOIN users u ON u.id = tr.user_id
        GROUP BY u.id, u.name, u.phone_number
        ORDER BY total_tests DESC LIMIT 10
      `),
        ]);
        // تعداد کل کاربران
        const [{ count: totalUsers }] = await this.ds.query('SELECT COUNT(*)::int as count FROM users WHERE role=$1', ['user']);
        // نرخ تکمیل هر تست
        const perTestWithRate = perTest.map((t) => ({
            ...t,
            completion_rate: totalUsers > 0
                ? Math.round((t.unique_users / totalUsers) * 100)
                : 0,
        }));
        // نتایج برجسته هر تست
        const resultMap = {};
        resultDist.forEach((r) => {
            if (!resultMap[r.test_name])
                resultMap[r.test_name] = [];
            resultMap[r.test_name].push({ result: r.main_result, count: r.count });
        });
        return {
            totalUsers: Number(totalUsers),
            perTest: perTestWithRate,
            daily,
            resultDistribution: resultMap,
            topUsers,
            summary: {
                totalAnswers: perTest.reduce((s, t) => s + t.total, 0),
                activeTests: perTest.length,
                avgTestsPerUser: perTest.length > 0
                    ? Math.round(perTest.reduce((s, t) => s + t.unique_users, 0) / Math.max(1, Number(totalUsers)))
                    : 0,
            }
        };
    }
    async getTest(req, testId) {
        requireAdmin(req.user);
        const config = await this.ds.query('SELECT * FROM test_configurations WHERE test_id=$1', [testId]);
        const results = await this.ds.query(`
      SELECT tr.id, tr.main_result, (tr.scores->>'total')::numeric, tr.created_at,
             u.name, u.phone_number
      FROM test_results tr JOIN users u ON u.id=tr.user_id
      WHERE tr.test_name=$1 ORDER BY tr.created_at DESC LIMIT 20
    `, [testId]);
        const stats = await this.ds.query(`
      SELECT COUNT(*) as total, COUNT(DISTINCT user_id) as unique_users,
        AVG((scores->>'total')::numeric) as avg_score
      FROM test_results WHERE test_name=$1
    `, [testId]);
        return { config: config[0] || null, results, stats: stats[0] };
    }
    /** ذخیره/آپدیت تنظیمات تست */
    async saveConfig(req, testId, body) {
        requireAdmin(req.user);
        const phone = req.user?.mobileNumber || req.user?.phone_number || '';
        const existing = await this.ds.query('SELECT id FROM test_configurations WHERE test_id=$1', [testId]);
        if (existing.length) {
            await this.ds.query(`
        UPDATE test_configurations SET
          name=$1, description=$2, is_active=$3, is_locked=$4,
          custom_questions=$5, custom_options=$6, admin_notes=$7,
          updated_by=$8, updated_at=NOW()
        WHERE test_id=$9
      `, [body.name, body.description, body.is_active ?? true,
                body.is_locked ?? false, JSON.stringify(body.custom_questions || null),
                JSON.stringify(body.custom_options || null), body.admin_notes, phone, testId]);
        }
        else {
            await this.ds.query(`
        INSERT INTO test_configurations
          (test_id, name, description, is_active, is_locked, custom_questions, custom_options, admin_notes, updated_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [testId, body.name, body.description, body.is_active ?? true,
                body.is_locked ?? false, JSON.stringify(body.custom_questions || null),
                JSON.stringify(body.custom_options || null), body.admin_notes, phone]);
        }
        return { success: true };
    }
    /** حذف آمار یک تست */
    async clearResults(req, testId) {
        requireAdmin(req.user);
        const r = await this.ds.query('DELETE FROM test_results WHERE test_name=$1 RETURNING id', [testId]);
        return { success: true, deleted: r.length };
    }
    /** آمار کلی */
    async overview(req) {
        requireAdmin(req.user);
        const stats = await this.ds.query(`
      SELECT test_name,
        COUNT(*) as total_taken,
        COUNT(DISTINCT user_id) as unique_users,
        ROUND(AVG((scores->>'total')::numeric), 1) as avg_score,
        MAX(created_at) as last_taken
      FROM test_results
      GROUP BY test_name ORDER BY total_taken DESC
    `);
        return stats;
    }
};
exports.TestAdminController = TestAdminController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestAdminController.prototype, "getTests", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestAdminController.prototype, "analytics", null);
__decorate([
    (0, common_1.Get)(':testId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TestAdminController.prototype, "getTest", null);
__decorate([
    (0, common_1.Post)(':testId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('testId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TestAdminController.prototype, "saveConfig", null);
__decorate([
    (0, common_1.Delete)(':testId/results'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TestAdminController.prototype, "clearResults", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestAdminController.prototype, "overview", null);
exports.TestAdminController = TestAdminController = __decorate([
    (0, common_1.Controller)('admin/tests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], TestAdminController);
