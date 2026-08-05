import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rgci_responses')
export class RgciResponse {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() user_id: string;
  @Column({ nullable: true }) event_id: string;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) dim_psychological_need: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) dim_relational_goal: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) dim_emotional_readiness: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) dim_interaction_style: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) dim_depth_disclosure: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) dim_shared_experience: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) dim_participation: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) dim_psychological_safety: number;
  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true }) dim_homogeneity_pref: number;
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true }) rgci_total_score: number;
  @Column({ nullable: true }) dominant_psychological_need: string;
  @Column({ type: 'jsonb', nullable: true }) raw_responses: any;
  @CreateDateColumn() created_at: Date;
}
