import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Makes the production smart_profiles table match the test/profile contract.
 * Every addition is idempotent, so installations that already have part of
 * the newer profile model remain safe.
 */
export class AddSmartProfileTestFields1782000000000 implements MigrationInterface {
  name = 'AddSmartProfileTestFields1782000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE smart_profiles
        ADD COLUMN IF NOT EXISTS mbti_type varchar,
        ADD COLUMN IF NOT EXISTS mbti_ei double precision NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS mbti_sn double precision NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS mbti_tf double precision NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS mbti_jp double precision NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS neo_e double precision NOT NULL DEFAULT 15,
        ADD COLUMN IF NOT EXISTS neo_a double precision NOT NULL DEFAULT 15,
        ADD COLUMN IF NOT EXISTS neo_c double precision NOT NULL DEFAULT 15,
        ADD COLUMN IF NOT EXISTS neo_n double precision NOT NULL DEFAULT 15,
        ADD COLUMN IF NOT EXISTS neo_o double precision NOT NULL DEFAULT 15,
        ADD COLUMN IF NOT EXISTS ecr_anxiety double precision NOT NULL DEFAULT 31,
        ADD COLUMN IF NOT EXISTS ecr_avoidance double precision NOT NULL DEFAULT 31,
        ADD COLUMN IF NOT EXISTS attachment_style varchar,
        ADD COLUMN IF NOT EXISTS erq_reappraisal double precision NOT NULL DEFAULT 21,
        ADD COLUMN IF NOT EXISTS erq_suppression double precision NOT NULL DEFAULT 14,
        ADD COLUMN IF NOT EXISTS iri_empathy double precision NOT NULL DEFAULT 20,
        ADD COLUMN IF NOT EXISTS iri_perspective double precision NOT NULL DEFAULT 20,
        ADD COLUMN IF NOT EXISTS hex_h double precision,
        ADD COLUMN IF NOT EXISTS hex_e double precision,
        ADD COLUMN IF NOT EXISTS hex_x double precision,
        ADD COLUMN IF NOT EXISTS hex_a double precision,
        ADD COLUMN IF NOT EXISTS hex_c double precision,
        ADD COLUMN IF NOT EXISTS hex_o double precision,
        ADD COLUMN IF NOT EXISTS gottman_score double precision,
        ADD COLUMN IF NOT EXISTS gottman_horsemen jsonb,
        ADD COLUMN IF NOT EXISTS love_lang_primary varchar,
        ADD COLUMN IF NOT EXISTS love_lang_scores jsonb,
        ADD COLUMN IF NOT EXISTS conflict_style varchar,
        ADD COLUMN IF NOT EXISTS sexual_compat_score double precision,
        ADD COLUMN IF NOT EXISTS phq9_score integer,
        ADD COLUMN IF NOT EXISTS gad7_score integer,
        ADD COLUMN IF NOT EXISTS dass_d integer,
        ADD COLUMN IF NOT EXISTS dass_a integer,
        ADD COLUMN IF NOT EXISTS dass_s integer,
        ADD COLUMN IF NOT EXISTS bai_score integer,
        ADD COLUMN IF NOT EXISTS isi_score integer,
        ADD COLUMN IF NOT EXISTS asrs_score integer,
        ADD COLUMN IF NOT EXISTS mdq_score integer,
        ADD COLUMN IF NOT EXISTS ybocs_score integer,
        ADD COLUMN IF NOT EXISTS pcl5_score integer,
        ADD COLUMN IF NOT EXISTS bdi2_score integer,
        ADD COLUMN IF NOT EXISTS pid5_dims jsonb,
        ADD COLUMN IF NOT EXISTS ysq_schemas jsonb,
        ADD COLUMN IF NOT EXISTS mmpi_flags jsonb,
        ADD COLUMN IF NOT EXISTS mcmi_flags jsonb,
        ADD COLUMN IF NOT EXISTS test_signature jsonb,
        ADD COLUMN IF NOT EXISTS matching_confidence double precision NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS deal_breakers text,
        ADD COLUMN IF NOT EXISTS green_flags text,
        ADD COLUMN IF NOT EXISTS mental_health_score double precision,
        ADD COLUMN IF NOT EXISTS relationship_readiness double precision,
        ADD COLUMN IF NOT EXISTS compatibility_vector jsonb,
        ADD COLUMN IF NOT EXISTS last_test_sync timestamp,
        ADD COLUMN IF NOT EXISTS event_feedback jsonb;
    `);
  }

  async down(): Promise<void> {
    // Keeping analytical profile data is safer than destructive rollback.
  }
}
