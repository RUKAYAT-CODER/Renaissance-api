import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PredictionsService } from './predictions.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Predictions')
@Controller('predictions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a match prediction',
    description:
      'Submit a prediction for a match outcome. Free predictions for leaderboard rankings.',
  })
  @ApiBody({ type: CreatePredictionDto })
  @ApiResponse({
    status: 201,
    description: 'Prediction successfully created',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e12b-34d5-a678-901234567890',
        matchId: '789e0123-e45b-67d8-a901-234567890123',
        predictedOutcome: 'home_win',
        isCorrect: null,
        points: null,
        createdAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation failed or prediction already exists for this match',
    schema: {
      example: {
        statusCode: 400,
        message: 'You have already made a prediction for this match',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Match not found',
  })
  create(@Request() req, @Body() createPredictionDto: CreatePredictionDto) {
    return this.predictionsService.create(req.user.id, createPredictionDto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user predictions',
    description: 'Retrieves all predictions made by the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User predictions retrieved successfully',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          matchId: '789e0123-e45b-67d8-a901-234567890123',
          predictedOutcome: 'home_win',
          isCorrect: true,
          points: 10,
          createdAt: '2024-01-15T10:30:00Z',
          match: {
            homeTeam: 'Manchester United',
            awayTeam: 'Liverpool FC',
            status: 'finished',
            outcome: 'home_win',
          },
        },
        {
          id: '234e5678-e90b-12d3-a456-426614174001',
          matchId: '890e1234-e56b-78d9-a012-345678901234',
          predictedOutcome: 'away_win',
          isCorrect: false,
          points: 0,
          createdAt: '2024-01-14T15:20:00Z',
          match: {
            homeTeam: 'Chelsea FC',
            awayTeam: 'Arsenal FC',
            status: 'finished',
            outcome: 'draw',
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  findAll(@Request() req) {
    return this.predictionsService.findAllByUser(req.user.id);
  }
}
