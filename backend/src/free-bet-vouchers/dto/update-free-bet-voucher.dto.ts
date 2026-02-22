import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class UpdateFreeBetVoucherDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxActiveVouchersPerUser?: number;
}
