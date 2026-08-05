import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('test_results')
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ nullable: true })
  test_id: string;

  @Column()
  test_name: string;

  @Column({ nullable: true })
  main_result: string;

  @Column({ type: 'jsonb' })
  scores: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  completed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
