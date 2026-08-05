import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('relational_experience_quality')
export class RelationalExperienceQuality {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() user_id: string;
  @Column() event_id: string;
  @Column({ nullable: true }) group_id: string;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) psychological_safety: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) felt_heard: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) felt_accepted: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) conversation_quality: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) interaction_meaning: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) participation_comfort: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) felt_connected: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) group_satisfaction: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) continued_interest: number;
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true }) total_score: number;
  @Column({ type: 'jsonb', nullable: true }) raw_responses: any;
  @CreateDateColumn() created_at: Date;
}
