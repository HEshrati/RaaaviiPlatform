import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ContentStatus { DRAFT='draft', PENDING='pending', PUBLISHED='published', REJECTED='rejected' }
export enum ContentCategory { ATTACHMENT='attachment', COMMUNICATION='communication', EMOTION='emotion', SOCIAL='social', PSYCHOLOGY='psychology', RELATIONSHIP='relationship' }

@Entity('ai_content')
export class AiContent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ type:'text' }) content: string;
  @Column({ type:'text', nullable:true }) summary: string;
  @Column({ type:'varchar', default:ContentStatus.DRAFT }) status: ContentStatus;
  @Column({ type:'varchar', nullable:true }) category: ContentCategory;
  @Column({ type:'simple-array', nullable:true }) tags: string[];
  @Column({ nullable:true }) source_reference: string;
  @Column({ nullable:true }) topic_group: string;
  @Column({ nullable:true }) reference_author: string;
  @Column({ nullable:true }) emoji: string;
  @Column({ nullable:true }) image_url: string;
  @Column({ nullable:true }) unsplash_query: string;
  @Column({ type:'int', default:0 }) word_count: number;
  @Column({ type:'int', default:0 }) read_time_minutes: number;
  @Column({ type:'text', nullable:true }) admin_note: string;
  @Column({ nullable:true }) reviewed_by: string;
  @Column({ type:'timestamp', nullable:true }) reviewed_at: Date;
  @Column({ type:'timestamp', nullable:true }) published_at: Date;
  @Column({ type:'int', default:0 }) view_count: number;
  @Column({ type:'int', default:0 }) like_count: number;
  @Column({ nullable:true }) slug: string;
  @Column({ type:'text', nullable:true }) meta_description: string;
  @Column({ type:'jsonb', nullable:true }) recommended_for: string[];
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
