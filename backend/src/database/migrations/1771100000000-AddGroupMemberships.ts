import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupMemberships1771100000000 implements MigrationInterface {
  name = 'AddGroupMemberships1771100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES support_groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        joined_at TIMESTAMP DEFAULT NOW(),
        left_at TIMESTAMP,
        payment_id UUID,
        next_payment_due TIMESTAMP,
        sessions_attended INT DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(group_id, user_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_group_memberships_status ON group_memberships(status)
    `);

    // جلسات گروه (برای حضور و غیاب و یادداشت هر جلسه)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES support_groups(id) ON DELETE CASCADE,
        session_date TIMESTAMP NOT NULL,
        session_number INT,
        topic VARCHAR(300),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_group_sessions_group_id ON group_sessions(group_id)
    `);

    // حضور و غیاب هر عضو در هر جلسه
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_session_attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
        membership_id UUID NOT NULL REFERENCES group_memberships(id) ON DELETE CASCADE,
        attended BOOLEAN DEFAULT false,
        marked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(session_id, membership_id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_session_attendance`);
    await queryRunner.query(`DROP TABLE IF EXISTS group_sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS group_memberships`);
  }
}
