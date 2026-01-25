import { IsUUID, IsNumber, IsPositive, IsDateString, IsOptional } from 'class-validator';

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
}
