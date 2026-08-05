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
var MatchingScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const matching_service_1 = require("./matching.service");
let MatchingScheduler = MatchingScheduler_1 = class MatchingScheduler {
    constructor(matchingService, ds) {
        this.matchingService = matchingService;
        this.ds = ds;
        this.logger = new common_1.Logger(MatchingScheduler_1.name);
    }
    // هر ۵ دقیقه چک کن رویدادهایی که ظرفیت پر شده ولی matching نشدن
    async runAutoMatching() {
        const events = await this.ds.query(`
      SELECT e.id, e.event_type, e.capacity, e.current_bookings
      FROM events e
      WHERE e.is_active = true
        AND e.current_bookings >= e.capacity
        AND e.start_date > NOW()
        AND NOT EXISTS (
          SELECT 1 FROM match_groups mg WHERE mg.event_id = e.id
        )
    `);
        for (const event of events) {
            try {
                this.logger.log(`Auto-matching event ${event.id} (${event.current_bookings}/${event.capacity})`);
                const result = await this.matchingService.runMatchingForEvent(event.id, event.event_type || 'mixed');
                this.logger.log(`Event ${event.id}: ${result.groups} groups for ${result.members} members`);
            }
            catch (e) {
                this.logger.error(`Auto-matching failed for event ${event.id}: ${e.message}`);
            }
        }
    }
    // ۲۴ ساعت قبل از رویداد re-matching برای گروه‌های ناقص
    async rematchIncompleteGroups() {
        const events = await this.ds.query(`
      SELECT e.id, e.event_type
      FROM events e
      WHERE e.is_active = true
        AND e.start_date BETWEEN NOW() AND NOW() + INTERVAL '25 hours'
        AND EXISTS (SELECT 1 FROM match_groups mg WHERE mg.event_id = e.id)
    `);
        for (const event of events) {
            try {
                this.logger.log(`Re-matching event ${event.id} (24h before start)`);
                await this.matchingService.runMatchingForEvent(event.id, event.event_type || 'mixed');
            }
            catch (e) {
                this.logger.error(`Re-matching failed for event ${event.id}: ${e.message}`);
            }
        }
    }
};
exports.MatchingScheduler = MatchingScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MatchingScheduler.prototype, "runAutoMatching", null);
__decorate([
    (0, schedule_1.Cron)('0 8 * * *') // هر روز ساعت ۸ صبح
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MatchingScheduler.prototype, "rematchIncompleteGroups", null);
exports.MatchingScheduler = MatchingScheduler = MatchingScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [matching_service_1.MatchingService,
        typeorm_2.DataSource])
], MatchingScheduler);
