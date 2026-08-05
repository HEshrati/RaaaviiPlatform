import { IsNotEmpty, IsString, IsNumber, IsOptional, IsIn, Min, Max, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1)
  quantity?: number;

  @IsString()
  @IsOptional()
  @IsUUID()
  plusOneUserId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  @IsIn(['zarinpal', 'wallet'])
  paymentMethod?: 'zarinpal' | 'wallet';
}
