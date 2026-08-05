import { IsString, IsObject, IsOptional, IsNumber } from 'class-validator';

export class CreateTestResultDto {
  @IsString()
  test_name: string;

  @IsString()
  @IsOptional()
  test_id?: string;

  @IsString()
  @IsOptional()
  main_result?: string;

  @IsObject()
  @IsOptional()
  scores?: any;

  @IsObject()
  @IsOptional()
  answers?: any;

  @IsNumber()
  @IsOptional()
  total_score?: number;

  @IsNumber()
  @IsOptional()
  phase?: number;
}
