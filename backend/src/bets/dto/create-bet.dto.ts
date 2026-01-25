import { IsUUID, IsNumber, IsEnum, IsPositive, Min, IsOptional } from 'class-validator';
import { MatchOutcome } from '../../matches/entities/match.entity';

export class CreateBetDto {
  @IsUUID()
  matchId: string;

  @IsNumber()
  @IsPositive()
  @Min(0.00000001, { message: 'Stake amount must be greater than 0' })
  stakeAmount: number;

  @IsEnum(MatchOutcome, {
    message: 'predictedOutcome must be one of: home_win, away_win, draw',
  })
  predictedOutcome: MatchOutcome;

  /** Optional. Free bet voucher id. When set, stake is taken from voucher (non-withdrawable, betting only); voucher is consumed on use. */
  @IsOptional()
  @IsUUID()
  voucherId?: string;
}
