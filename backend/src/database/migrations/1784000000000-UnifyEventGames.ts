import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnifyEventGames1784000000000 implements MigrationInterface {
  name = 'UnifyEventGames1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO event_quizzes
        (id, event_id, title, questions, game_type, settings, is_active, created_at, updated_at)
      SELECT
        eg.id,
        eg.event_id,
        eg.title,
        COALESCE((
          SELECT jsonb_agg(
            q || jsonb_build_object(
              'correct_answer', COALESCE(q->'correct_answer', q->'correct', '0'::jsonb)
            )
          )
          FROM jsonb_array_elements(COALESCE(eg.questions, '[]'::jsonb)) q
        ), '[]'::jsonb),
        eg.game_type,
        jsonb_build_object('description', COALESCE(eg.description, '')),
        COALESCE(eg.is_active, true),
        COALESCE(eg.created_at, NOW()),
        COALESCE(eg.updated_at, NOW())
      FROM event_games eg
      WHERE eg.event_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM event_quizzes eq WHERE eq.id = eg.id)
    `);

    await queryRunner.query(`
      DELETE FROM quiz_results older
      USING quiz_results newer
      WHERE older.quiz_id = newer.quiz_id
        AND older.user_id = newer.user_id
        AND (older.completed_at, older.id) > (newer.completed_at, newer.id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_quiz_results_quiz_user"
      ON quiz_results (quiz_id, user_id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_refresh_tokens_hash"
      ON refresh_tokens (token_hash)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "UQ_quiz_results_quiz_user"');
    await queryRunner.query('DROP INDEX IF EXISTS "UQ_refresh_tokens_hash"');
  }
}
