import { IsNumber, IsString, Min, Max, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSpinDto {
  @IsNumber()
  @Min(0.01, { message: 'Stake amount must be at least 0.01' })
  @Max(1000, { message: 'Stake amount cannot exceed 1000' })
  @Transform(({ value }) => parseFloat(value))
  stakeAmount: number;

  @IsString()
  @IsOptional()
  clientSeed?: string; // Optional client-provided seed for additional randomness
}