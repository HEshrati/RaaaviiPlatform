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
exports.JourneyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let JourneyService = class JourneyService {
    constructor(ds) {
        this.ds = ds;
    }
    async getMyJourney(userId) {
        const states = await this.ds.query(`SELECT * FROM user_journey_states WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 1`, [userId]).catch(() => []);
        const events = await this.ds.query(`SELECT * FROM user_journey_events WHERE user_id=$1 ORDER BY occurred_at DESC LIMIT 20`, [userId]).catch(() => []);
        return { current_state: states[0] || null, recent_events: events };
    }
    async trackEvent(userId, eventType, metadata) {
        await this.ds.query(`
      INSERT INTO user_journey_events (user_id, event_type, metadata)
      VALUES ($1, $2, $3)
    `, [userId, eventType, JSON.stringify(metadata || {})]).catch(() => { });
        return { success: true };
    }
    async updateState(userId, phase, data) {
        await this.ds.query(`
      INSERT INTO user_journey_states (user_id, current_phase, phase_data)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET
        current_phase=$2, phase_data=$3, updated_at=NOW()
    `, [userId, phase, JSON.stringify(data || {})]).catch(() => { });
        return { success: true };
    }
};
exports.JourneyService = JourneyService;
exports.JourneyService = JourneyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], JourneyService);
