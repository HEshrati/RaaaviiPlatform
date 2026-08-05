import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToOne,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { User } from '../../users/entities/user.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'uuid' }) event_id: string;
  @Column({ type: 'uuid' }) user_id: string;

  @Column({ default: 'pending' }) status: string;
  @Column({ default: 'unpaid' }) payment_status: string;

  // matching integration
  @Column({ default: 'matching_pending' }) matching_status: string;
  @Column({ type: 'uuid', nullable: true }) group_id: string;
  @Column({ type: 'uuid', nullable: true }) session_id: string;
  @Column({ default: false }) accept_rules: boolean;

  @Column({ type: 'uuid', nullable: true }) payment_id: string;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) amount_paid: number;
  @Column({ unique: true, nullable: true }) booking_code: string;

  @Column({ type: 'timestamp', nullable: true }) locked_until: Date;
  @Column({ nullable: true }) locked_by_session: string;
  @Column({ nullable: true }) confirmation_code: string;
  @Column({ type: 'text', nullable: true }) cancellation_reason: string;
  @Column({ type: 'timestamp', nullable: true }) cancelled_at: Date;
  @Column({ type: 'timestamp', nullable: true }) confirmed_at: Date;
  @Column({ type: 'timestamp', nullable: true }) completed_at: Date;
  @Column({ type: 'timestamp', nullable: true }) no_show_at: Date;

  @Column({ default: false }) attended: boolean;
  @Column({ type: 'timestamp', nullable: true }) attendance_marked_at: Date;

  /** زمان آخرین ارسال موفق مکان دقیق؛ با تغییر مکان دوباره null می‌شود. */
  @Column({ type: 'timestamp', nullable: true }) location_notified_at: Date;

  @Column({ nullable: true }) payment_type: string;
  @Column({ default: false, nullable: true }) wallet_deducted: boolean;
  @Column({ type: 'integer', nullable: true }) rating: number;
  @Column({ type: 'text', nullable: true }) rating_text: string;
  @Column({ type: 'timestamp', nullable: true }) rated_at: Date;

  @Column({ type: 'jsonb', nullable: true }) metadata: any;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;

  @ManyToOne(() => Event, (event) => event.bookings)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment: Payment;
}
