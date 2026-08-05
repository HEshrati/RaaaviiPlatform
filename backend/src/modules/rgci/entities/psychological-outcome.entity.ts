import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('psychological_outcomes')
export class PsychologicalOutcome {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() user_id: string;
  @Column({ nullable: true }) event_id: string;
  @Column() stage: string;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) belonging_score: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) loneliness_score: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) social_vitality: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) wellbeing_score: number;
  @Column({ type: 'jsonb', nullable: true }) raw_responses: any;
  @CreateDateColumn() created_at: Date;
}
