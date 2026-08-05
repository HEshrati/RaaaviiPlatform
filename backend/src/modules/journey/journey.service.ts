import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class JourneyService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  async getMyJourney(userId: string) {
    const states = await this.ds.query(
      `SELECT * FROM user_journey_states WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    ).catch(() => []);

    const events = await this.ds.query(
      `SELECT * FROM user_journey_events WHERE user_id=$1 ORDER BY occurred_at DESC LIMIT 20`,
      [userId]
    ).catch(() => []);

    return { current_state: states[0] || null, recent_events: events };
  }

  async trackEvent(userId: string, eventType: string, metadata?: any) {
    await this.ds.query(`
      INSERT INTO user_journey_events (user_id, event_type, metadata)
      VALUES ($1, $2, $3)
    `, [userId, eventType, JSON.stringify(metadata||{})]).catch(() => {});
    return { success: true };
  }

  async updateState(userId: string, phase: string, data?: any) {
    await this.ds.query(`
      INSERT INTO user_journey_states (user_id, current_phase, phase_data)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET
        current_phase=$2, phase_data=$3, updated_at=NOW()
    `, [userId, phase, JSON.stringify(data||{})]).catch(() => {});
    return { success: true };
  }
}
