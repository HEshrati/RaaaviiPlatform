import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * هم‌راستاسازی پایگاه داده با spec مچینگ RGCI.
 * تمام دستورات idempotent هستند تا روی نصب‌های قدیمی که جدول groups دارند نیز امن اجرا شوند.
 */
export class AlignMatchingSchema1780000000000 implements MigrationInterface {
  name = 'AlignMatchingSchema1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_rgci_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        questionnaire_version varchar NOT NULL DEFAULT 'rgci_v1',
        psychological_need_score numeric(5,2) NOT NULL,
        psychological_need_level varchar,
        goal_score numeric(5,2) NOT NULL,
        goal_level varchar,
        participation_score numeric(5,2) NOT NULL,
        participation_level varchar,
        safety_score numeric(5,2) NOT NULL,
        safety_level varchar,
        diversity_score numeric(5,2) NOT NULL,
        diversity_level varchar,
        performance_score numeric(5,2) NOT NULL,
        performance_level varchar,
        burnout_risk numeric(5,2) NOT NULL,
        wellbeing_score numeric(5,2) NOT NULL,
        wellbeing_level varchar,
        satisfaction_score numeric(5,2) NOT NULL,
        satisfaction_level varchar,
        generated_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS match_queue (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        preferences jsonb,
        status varchar NOT NULL DEFAULT 'waiting',
        joined_at timestamp NOT NULL DEFAULT now(),
        matched_at timestamp,
        UNIQUE(event_id, user_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pair_scores (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_a_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_b_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        compatibility_score numeric(6,4) NOT NULL,
        dimension_breakdown jsonb,
        calculated_at timestamp NOT NULL DEFAULT now(),
        CHECK (user_a_id < user_b_id),
        UNIQUE(event_id, user_a_id, user_b_id)
      )
    `);

    await queryRunner.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS size integer`);
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS quality_label varchar`);
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS compatibility_score numeric(6,4)`);
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS group_score numeric(6,4)`);
    await queryRunner.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS fallback_used boolean NOT NULL DEFAULT false`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        assignment_type varchar NOT NULL,
        assigned_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(group_id, user_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_predicted_indices (
        group_id uuid PRIMARY KEY REFERENCES groups(id) ON DELETE CASCADE,
        predicted_performance numeric(6,4),
        predicted_wellbeing numeric(6,4),
        predicted_satisfaction numeric(6,4)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_assignment_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
        assignment_type varchar NOT NULL,
        assignment_reason text,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`ALTER TABLE events ALTER COLUMN min_group_size SET DEFAULT 4`);
    await queryRunner.query(`ALTER TABLE events ALTER COLUMN max_group_size SET DEFAULT 8`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_match_queue_event_status ON match_queue(event_id, status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pair_scores_event ON pair_scores(event_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_rgci_profiles_user ON user_rgci_profiles(user_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_rgci_profiles_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_group_members_group`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pair_scores_event`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_match_queue_event_status`);
    // داده‌های مچینگ رکورد عملیاتی/تحلیلی هستند؛ rollback ساختار را حذف نمی‌کند.
  }
}
