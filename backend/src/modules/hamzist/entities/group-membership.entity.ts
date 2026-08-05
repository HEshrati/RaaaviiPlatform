import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupportGroup } from '../../my-therapist/entities/support-group.entity';

export type MembershipStatus = 'active' | 'left' | 'removed' | 'pending_payment';

@Entity('group_memberships')
export class GroupMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @ManyToOne(() => SupportGroup)
  @JoinColumn({ name: 'group_id' })
  group: SupportGroup;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ length: 20, default: 'active' })
  status: MembershipStatus;

  @CreateDateColumn()
  joined_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  left_at: Date;

  @Column({ type: 'uuid', nullable: true })
  payment_id: string;

  @Column({ type: 'timestamp', nullable: true })
  next_payment_due: Date;

  @Column({ type: 'int', default: 0 })
  sessions_attended: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
