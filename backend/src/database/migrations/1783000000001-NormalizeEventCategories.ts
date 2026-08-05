import { MigrationInterface, QueryRunner } from 'typeorm';

/** استانداردسازی شناسه‌های قدیمی بدون تغییر مفهوم دسته‌بندی رویداد. */
export class NormalizeEventCategories1783000000001 implements MigrationInterface {
  name = 'NormalizeEventCategories1783000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE events SET category=CASE
        WHEN LOWER(REPLACE(category,'_','-')) IN ('rashdfardi','rashd-fardi')
          OR BTRIM(category) IN ('رشد فردی','توسعه فردی') THEN 'rashd-fardi'
        WHEN LOWER(REPLACE(category,'_','-')) IN ('groupsupport','group-support') THEN 'group-support'
        WHEN LOWER(REPLACE(category,'_','-')) IN ('grouptherapy','group-therapy','therapist','tarapist') THEN 'group-therapy'
        ELSE LOWER(REPLACE(BTRIM(category),'_','-'))
      END
      WHERE category IS NOT NULL AND BTRIM(category) <> ''
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // تبدیل استاندارد برگشت‌پذیر نیست و rollback نباید دادهٔ معتبر را مبهم کند.
  }
}
