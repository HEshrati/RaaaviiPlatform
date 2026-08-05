import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * همگام‌سازی اسکیمای محیط‌های قدیمی با مدل‌های فعلی تأیید حرفه‌ای‌ها.
 * تمام دستورات idempotent هستند تا روی دیتابیس‌هایی که بخشی از ستون‌ها را
 * از قبل دارند هم امن اجرا شوند.
 */
export class ProfessionalVerificationConsistency1781000000000 implements MigrationInterface {
  name = 'ProfessionalVerificationConsistency1781000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE psychologist_profiles
        ADD COLUMN IF NOT EXISTS license_number varchar,
        ADD COLUMN IF NOT EXISTS mobile_number varchar,
        ADD COLUMN IF NOT EXISTS name_from_irimc varchar,
        ADD COLUMN IF NOT EXISTS province varchar,
        ADD COLUMN IF NOT EXISTS irimc_status varchar,
        ADD COLUMN IF NOT EXISTS verification_status varchar NOT NULL DEFAULT 'pending_admin',
        ADD COLUMN IF NOT EXISTS public_profile_status varchar NOT NULL DEFAULT 'hidden',
        ADD COLUMN IF NOT EXISTS available_times text,
        ADD COLUMN IF NOT EXISTS working_areas text,
        ADD COLUMN IF NOT EXISTS resume_url varchar,
        ADD COLUMN IF NOT EXISTS admin_note text,
        ADD COLUMN IF NOT EXISTS verified_at timestamp;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_psychologist_profiles_license_number
      ON psychologist_profiles (license_number)
      WHERE license_number IS NOT NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE venue_profiles
        ADD COLUMN IF NOT EXISTS accepted_terms boolean NOT NULL DEFAULT false;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS ux_psychologist_profiles_license_number`);
    await queryRunner.query(`ALTER TABLE venue_profiles DROP COLUMN IF EXISTS accepted_terms`);
    await queryRunner.query(`
      ALTER TABLE psychologist_profiles
        DROP COLUMN IF EXISTS verified_at,
        DROP COLUMN IF EXISTS admin_note,
        DROP COLUMN IF EXISTS resume_url,
        DROP COLUMN IF EXISTS working_areas,
        DROP COLUMN IF EXISTS available_times,
        DROP COLUMN IF EXISTS public_profile_status,
        DROP COLUMN IF EXISTS verification_status,
        DROP COLUMN IF EXISTS irimc_status,
        DROP COLUMN IF EXISTS province,
        DROP COLUMN IF EXISTS name_from_irimc,
        DROP COLUMN IF EXISTS mobile_number,
        DROP COLUMN IF EXISTS license_number;
    `);
  }
}
