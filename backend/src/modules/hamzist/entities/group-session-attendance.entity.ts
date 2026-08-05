import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GroupSession } from './group-session.entity';
import { GroupMembership } from './group-membership.entity';

@Entity('group_session_attendance')
export class GroupSessionAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @ManyToOne(() => GroupSession)
  @JoinColumn({ name: 'session_id' })
  session: GroupSession;

  @Column({ type: 'uuid' })
  membership_id: string;

  @ManyToOne(() => GroupMembership)
  @JoinColumn({ name: 'membership_id' })
  membership: GroupMembership;

  @Column({ default: false })
  attended: boolean;

  @CreateDateColumn()
  marked_at: Date;
}
