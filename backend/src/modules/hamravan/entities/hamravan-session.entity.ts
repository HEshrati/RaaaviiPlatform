import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('hamravan_sessions')
export class HamravanSession {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() user_id: string;
  @Column({ nullable: true }) psychologist_id: string;
  @Column({ default: 'pending' }) status: string;
  @Column({ nullable: true }) dominant_need: string;
  @Column({ nullable: true }) session_notes: string;
  @Column({ nullable: true }) referral_path: string;
  @Column({ type: 'jsonb', nullable: true }) pre_session_data: any;
  @Column({ type: 'jsonb', nullable: true }) post_session_data: any;
  @Column({ nullable: true }) scheduled_at: Date;
  @Column({ nullable: true }) completed_at: Date;
  @CreateDateColumn() created_at: Date;
}



