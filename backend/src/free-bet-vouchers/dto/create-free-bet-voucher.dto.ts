import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateFreeBetVoucherDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  expiresAt: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxActiveVouchersPerUser?: number;
}
