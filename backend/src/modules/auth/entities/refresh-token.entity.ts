import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ length: 255 })
  token_hash: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @Column({ length: 64, nullable: true })
  ip_address: string;

  @Column({ default: false })
  is_revoked: boolean;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true, length: 255 })
  replaced_by_token_hash: string;
}
