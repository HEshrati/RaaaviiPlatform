import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventApprovalWorkflow1785000000000 implements MigrationInterface {
  name = 'EventApprovalWorkflow1785000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE events
        ADD COLUMN IF NOT EXISTS approval_status varchar(32) NOT NULL DEFAULT 'approved',
        ADD COLUMN IF NOT EXISTS submitted_by_role varchar(32) NOT NULL DEFAULT 'admin',
        ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
        ADD COLUMN IF NOT EXISTS reviewed_by uuid,
        ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
        ADD COLUMN IF NOT EXISTS review_note text
    `);
    await queryRunner.query(`
      UPDATE events
      SET approval_status='approved',
          submitted_by_role=COALESCE(NULLIF(submitted_by_role, ''), 'admin'),
          submitted_at=COALESCE(submitted_at, created_at)
      WHERE approval_status IS NULL OR approval_status=''
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_approval_status
      ON events(approval_status, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_created_by_approval
      ON events(created_by, approval_status)
    `);
    await queryRunner.query(`
      DELETE FROM event_hosts older
      USING event_hosts newer
      WHERE older.event_id=newer.event_id
        AND older.host_id=newer.host_id
        AND older.id < newer.id
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_event_hosts_event_host
      ON event_hosts(event_id, host_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_events_created_by_approval');
    await queryRunner.query('DROP INDEX IF EXISTS idx_events_approval_status');
    await queryRunner.query('DROP INDEX IF EXISTS uq_event_hosts_event_host');
    await queryRunner.query(`
      ALTER TABLE events
        DROP COLUMN IF EXISTS review_note,
        DROP COLUMN IF EXISTS reviewed_at,
        DROP COLUMN IF EXISTS reviewed_by,
        DROP COLUMN IF EXISTS submitted_at,
        DROP COLUMN IF EXISTS submitted_by_role,
        DROP COLUMN IF EXISTS approval_status
    `);
  }
}
