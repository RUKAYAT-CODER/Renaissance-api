import {
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RewardType } from '../entities/spin-session.entity';

export class CreateSpinSessionDto {
  @ApiProperty({
    description: 'Amount staked for this spin session',
    example: 10.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Stake amount must be non-negative' })
  @Transform(({ value }) => parseFloat(value))
  stakeAmount: number;

  @ApiPropertyOptional({
    description: 'Type of reward received',
    enum: RewardType,
    example: RewardType.NFT,
  })
  @IsEnum(RewardType)
  @IsOptional()
  rewardType?: RewardType;

  @ApiPropertyOptional({
    description: 'Value of the reward',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined ? parseFloat(value) : undefined,
  )
  rewardValue?: number;

  @ApiPropertyOptional({
    description: 'Transaction reference for the spin',
    example: 'tx_spin_20240115_abc123',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  txReference?: string;
}
