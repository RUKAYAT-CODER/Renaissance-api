import { PartialType } from '@nestjs/mapped-types';
import { CreateMatchDto } from './create-match.dto';
import { IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MatchOutcome } from '../../common/enums/match.enums';

export class UpdateMatchDto extends PartialType(CreateMatchDto) {
  @ApiPropertyOptional({
    description: 'Home team score',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Home score cannot be negative' })
  homeScore?: number;

  @ApiPropertyOptional({
    description: 'Away team score',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Away score cannot be negative' })
  awayScore?: number;

  @ApiPropertyOptional({
    description: 'Match outcome/result',
    enum: MatchOutcome,
    example: MatchOutcome.HOME_WIN,
  })
  @IsOptional()
  @IsEnum(MatchOutcome)
  outcome?: MatchOutcome;
}
