import {
    IsNumber,
    IsString,
    IsEnum,
    IsOptional,
    Min,
    MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RewardType } from '../entities/spin-session.entity';

/**
 * DTO for creating a new SpinSession record.
 */
export class CreateSpinSessionDto {
    @IsNumber()
    @Min(0, { message: 'Stake amount must be non-negative' })
    @Transform(({ value }) => parseFloat(value))
    stakeAmount: number;

    @IsEnum(RewardType)
    @IsOptional()
    rewardType?: RewardType;

    @IsNumber()
    @Min(0)
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
    rewardValue?: number;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    txReference?: string;
}
