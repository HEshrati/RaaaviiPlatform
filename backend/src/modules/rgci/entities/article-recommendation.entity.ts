import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('article_recommendations')
export class ArticleRecommendation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() user_id: string;
  @Column({ nullable: true }) article_id: string;
  @Column({ nullable: true }) psychological_need: string;
  @Column({ nullable: true }) recommendation_reason: string;
  @Column({ nullable: true }) clicked_at: Date;
  @Column({ default: 'not_read' }) read_status: string;
  @CreateDateColumn() shown_at: Date;
}
