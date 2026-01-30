// create-prediction.dto.ts
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchOutcome } from '../../common/enums/match.enums';

export class CreatePredictionDto {
  @ApiProperty({
    description: 'UUID of the match to predict',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  matchId: string;

  @ApiProperty({
    description: 'Predicted outcome of the match',
    enum: MatchOutcome,
    example: MatchOutcome.HOME_WIN,
    enumName: 'MatchOutcome',
  })
  @IsNotEmpty()
  @IsEnum(MatchOutcome)
  predictedOutcome: MatchOutcome;
}
