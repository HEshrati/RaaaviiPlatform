import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupportGroup } from '../../my-therapist/entities/support-group.entity';

export type GroupSessionStatus = 'scheduled' | 'completed' | 'cancelled';

@Entity('group_sessions')
export class GroupSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @ManyToOne(() => SupportGroup)
  @JoinColumn({ name: 'group_id' })
  group: SupportGroup;

  @Column({ type: 'timestamp' })
  session_date: Date;

  @Column({ type: 'int', nullable: true })
  session_number: number;

  @Column({ length: 300, nullable: true })
  topic: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 20, default: 'scheduled' })
  status: GroupSessionStatus;

  @CreateDateColumn()
  created_at: Date;
}
