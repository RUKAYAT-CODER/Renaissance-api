import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchStatus } from '../entities/match.entity';

export class CreateMatchDto {
  @ApiProperty({
    description: 'Home team name',
    example: 'Manchester United',
  })
  @IsString()
  homeTeam: string;

  @ApiProperty({
    description: 'Away team name',
    example: 'Liverpool FC',
  })
  @IsString()
  awayTeam: string;

  @ApiProperty({
    description: 'Match start time in ISO 8601 format',
    example: '2024-02-15T18:00:00Z',
  })
  @IsDateString()
  startTime: Date;

  @ApiPropertyOptional({
    description: 'Match status',
    enum: MatchStatus,
    example: MatchStatus.LIVE,
    default: MatchStatus.LIVE,
  })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @ApiPropertyOptional({
    description: 'League or competition name',
    example: 'Premier League',
  })
  @IsOptional()
  @IsString()
  league?: string;

  @ApiPropertyOptional({
    description: 'Season identifier',
    example: '2023-2024',
  })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional({
    description: 'Betting odds for home team win (minimum 1.01)',
    example: 1.85,
    minimum: 1.01,
  })
  @IsOptional()
  @IsNumber()
  @Min(1.01, { message: 'Home odds must be at least 1.01' })
  homeOdds?: number;

  @ApiPropertyOptional({
    description: 'Betting odds for draw (minimum 1.01)',
    example: 3.2,
    minimum: 1.01,
  })
  @IsOptional()
  @IsNumber()
  @Min(1.01, { message: 'Draw odds must be at least 1.01' })
  drawOdds?: number;

  @ApiPropertyOptional({
    description: 'Betting odds for away team win (minimum 1.01)',
    example: 2.1,
    minimum: 1.01,
  })
  @IsOptional()
  @IsNumber()
  @Min(1.01, { message: 'Away odds must be at least 1.01' })
  awayOdds?: number;

  @ApiPropertyOptional({
    description: 'Additional match metadata',
    example: { venue: 'Old Trafford', referee: 'John Doe' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
