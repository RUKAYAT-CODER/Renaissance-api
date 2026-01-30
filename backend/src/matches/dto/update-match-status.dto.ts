import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchStatus, MatchOutcome } from '../../common/enums/match.enums';

export class UpdateMatchStatusDto {
  @ApiProperty({
    description: 'New match status',
    enum: MatchStatus,
    example: MatchStatus.FINISHED,
  })
  @IsEnum(MatchStatus)
  status: MatchStatus;

  @ApiPropertyOptional({
    description: 'Home team final score',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Home score cannot be negative' })
  homeScore?: number;

  @ApiPropertyOptional({
    description: 'Away team final score',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Away score cannot be negative' })
  awayScore?: number;

  @ApiPropertyOptional({
    description: 'Match outcome',
    enum: MatchOutcome,
    example: MatchOutcome.HOME_WIN,
  })
  @IsOptional()
  @IsEnum(MatchOutcome)
  outcome?: MatchOutcome;
}
