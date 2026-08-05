import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('psychologist_profiles')
export class PsychologistProfile {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true }) userId: string;
  @Column({ name: 'license_number', unique: true })        licenseNumber: string;
  @Column({ name: 'mobile_number', nullable: true })       mobileNumber: string;
  @Column({ name: 'first_name', nullable: true })          firstName: string;
  @Column({ name: 'last_name', nullable: true })           lastName: string;
  @Column({ name: 'national_id', nullable: true })         nationalId: string;
  @Column({ name: 'name_from_irimc', nullable: true })     nameFromIrimc: string;
  @Column({ nullable: true })                              specialty: string;
  @Column({ nullable: true })                              province: string;
  @Column({ name: 'irimc_status', nullable: true })        irirmcStatus: string;

  // Machine State کامل
  @Column({ name: 'verification_status', default: 'pending_admin' }) verificationStatus: string;
  @Column({ name: 'professional_status', default: 'mobile_verified' }) professionalStatus: string;

  // Trust Score
  @Column({ name: 'trust_score', default: 0 })             trustScore: number;
  @Column({ name: 'trust_breakdown', type: 'jsonb', nullable: true }) trustBreakdown: any;

  // پروفایل تخصصی
  @Column({ type: 'jsonb', nullable: true })               specialties: any;
  @Column({ name: 'session_types', type: 'jsonb', nullable: true }) sessionTypes: any;
  @Column({ name: 'default_session_duration', default: 50 }) defaultSessionDuration: number;
  @Column({ name: 'default_buffer_minutes', default: 10 }) defaultBufferMinutes: number;
  @Column({ name: 'public_profile_status', default: 'hidden' }) publicProfileStatus: string;

  @Column({ nullable: true, type: 'text' })                bio: string;
  @Column({ nullable: true })                              city: string;
  @Column({ name: 'session_price', nullable: true, type: 'int', default: 0 }) sessionPrice: number;
  @Column({ name: 'available_times', nullable: true, type: 'text' }) availableTimes: string;
  @Column({ name: 'working_areas', nullable: true, type: 'text' }) workingAreas: string;
  @Column({ name: 'resume_url', nullable: true })          resumeUrl: string;
  @Column({ type: 'jsonb', nullable: true })               documents: any;

  @Column({ name: 'admin_note', nullable: true, type: 'text' }) adminNote: string;
  @Column({ name: 'rejection_reason', nullable: true, type: 'text' }) rejectionReason: string;
  @Column({ name: 'needs_revision_reason', nullable: true, type: 'text' }) needsRevisionReason: string;

  @Column({ name: 'verified_at', nullable: true, type: 'timestamp' })   verifiedAt: Date | null;
  @Column({ name: 'submitted_at', nullable: true, type: 'timestamp' })  submittedAt: Date | null;
  @Column({ name: 'rejected_at', nullable: true, type: 'timestamp' })   rejectedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}


