import { IsString, IsOptional, IsNumber, IsArray, IsIn, IsDateString, IsUUID, Min } from 'class-validator';

export class CreateGroupDto {
  @IsUUID()
  @IsOptional()
  facilitator_id?: string;

  @IsString()
  name: string;

  @IsString()
  topic: string;

  @IsString()
  description: string;

  @IsString()
  schedule: string;

  @IsString()
  @IsOptional()
  schedule_weekday?: string;

  @IsString()
  @IsOptional()
  schedule_time?: string;

  @IsIn(['online', 'in_person'])
  @IsOptional()
  mode?: 'online' | 'in_person';

  @IsString()
  @IsOptional()
  city?: string;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsNumber()
  @Min(0)
  price_per_month: number;

  @IsIn(['high', 'medium', 'standard'])
  @IsOptional()
  confidentiality_level?: 'high' | 'medium' | 'standard';

  @IsArray()
  @IsOptional()
  rules?: string[];

  @IsString()
  @IsOptional()
  image_url?: string;
}

export class ScheduleSessionDto {
  @IsDateString()
  session_date: string;

  @IsNumber()
  @IsOptional()
  session_number?: number;

  @IsString()
  @IsOptional()
  topic?: string;
}

export class MarkAttendanceDto {
  @IsArray()
  attendance: { membership_id: string; attended: boolean }[];
}
