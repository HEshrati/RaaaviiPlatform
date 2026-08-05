import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokens1771000000000 implements MigrationInterface {
  name = 'AddRefreshTokens1771000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(64),
        is_revoked BOOLEAN DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        replaced_by_token_hash VARCHAR(255)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash)
    `);
    // پاک‌سازی توکن‌های یتیم پیش از ایجاد FK؛ در نصب‌های قدیمی ممکن است
    // رکوردهایی برای کاربر حذف‌شده باقی مانده باشد و catch کردن خطا داخل
    // تراکنش PostgreSQL آن را در وضعیت aborted رها می‌کند.
    await queryRunner.query(`
      DELETE FROM refresh_tokens rt
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = rt.user_id)
    `);
    const constraintExists = await queryRunner.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_refresh_tokens_user'
    `);
    if (!constraintExists.length) {
      await queryRunner.query(`
        ALTER TABLE refresh_tokens
        ADD CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
  }
}
