import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BetStatus } from '../entities/bet.entity';

export class UpdateBetStatusDto {
  @ApiProperty({
    description: 'New status for the bet',
    enum: BetStatus,
    example: BetStatus.WON,
    enumName: 'BetStatus',
  })
  @IsEnum(BetStatus, {
    message: 'status must be one of: pending, won, lost, cancelled',
  })
  status: BetStatus;
}

export class SettleMatchBetsDto {
  @ApiProperty({
    description: 'UUID of the match to settle all bets for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  matchId: string;
}
