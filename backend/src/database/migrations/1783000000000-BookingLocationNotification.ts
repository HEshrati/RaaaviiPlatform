import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Delivery marker is kept per booking so a failed SMS can be retried without
 * sending the exact address repeatedly to participants who already received it.
 */
export class BookingLocationNotification1783000000000 implements MigrationInterface {
  name = 'BookingLocationNotification1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS location_notified_at timestamp
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_location_notification
      ON bookings(event_id, location_notified_at)
      WHERE status IN ('confirmed', 'matched', 'completed')
    `);
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS min_pair_score numeric(6,4)`);
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS pair_score_variance numeric(8,6)`);
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS risk_pair_count integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS minimum_safety numeric(6,4)`);
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS participation_variance numeric(8,6)`);
    await queryRunner.query(`ALTER TABLE group_predicted_indices ADD COLUMN IF NOT EXISTS predicted_burnout numeric(6,4)`);
    // رزروهای پرداخت‌نشدهٔ قدیمی نباید برای همیشه ظرفیت را اشغال کنند.
    await queryRunner.query(`
      UPDATE bookings SET status='expired',updated_at=NOW()
      WHERE status='pending' AND payment_status='unpaid'
        AND COALESCE(locked_until,created_at + INTERVAL '20 minutes') < NOW()
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_active_event_user
      ON bookings(event_id,user_id)
      WHERE status NOT IN ('cancelled','expired')
    `);
    // شمارندهٔ مشتق‌شده را با رزروهای معتبر و تعداد همراه هم‌راستا می‌کند.
    await queryRunner.query(`
      UPDATE events e SET current_bookings=counts.actual
      FROM (
        SELECT event_id,COALESCE(SUM(
          COALESCE((metadata->>'quantity')::integer,1)
          + CASE WHEN metadata->>'plusOneUserId' IS NULL THEN 0 ELSE 1 END
        ),0)::integer AS actual
        FROM bookings
        WHERE status IN ('confirmed','matched','completed','no_show')
          AND payment_status IN ('paid','free')
        GROUP BY event_id
      ) counts
      WHERE e.id=counts.event_id
    `);
    await queryRunner.query(`
      UPDATE events e SET current_bookings=0
      WHERE NOT EXISTS (
        SELECT 1 FROM bookings b WHERE b.event_id=e.id
          AND b.status IN ('confirmed','matched','completed','no_show')
          AND b.payment_status IN ('paid','free')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bookings_location_notification`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_bookings_active_event_user`);
    await queryRunner.query(`ALTER TABLE bookings DROP COLUMN IF EXISTS location_notified_at`);
  }
}
