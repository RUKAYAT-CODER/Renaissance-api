import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LeaderboardsService } from './leaderboards.service';
import { LeaderboardQueryDto, LeaderboardResponseDto, TimeFilter } from './dto';

@ApiTags('Leaderboards')
@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  @Get('stakers')
  @ApiOperation({
    summary: 'Get top stakers leaderboard',
    description:
      'Retrieves a ranked list of users by total amount staked. Shows who has wagered the most.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Entries per page (max 100)',
  })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: TimeFilter,
    example: TimeFilter.ALL_TIME,
    description: 'Time period filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Stakers leaderboard retrieved successfully',
    type: LeaderboardResponseDto,
    schema: {
      example: {
        data: [
          {
            rank: 1,
            userId: '123e4567-e89b-12d3-a456-426614174000',
            username: 'bigbetter',
            firstName: 'John',
            lastName: 'Doe',
            avatar: 'https://example.com/avatar.jpg',
            value: 50000.0,
            metadata: {
              totalBets: 500,
              avgStake: 100.0,
            },
          },
        ],
        total: 1000,
        page: 1,
        limit: 10,
        totalPages: 100,
        timeFilter: 'all_time',
      },
    },
  })
  async getStakersLeaderboard(
    @Query() queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardsService.getStakersLeaderboard(queryDto);
  }

  @Get('earners')
  @ApiOperation({
    summary: 'Get top earners leaderboard',
    description:
      'Retrieves a ranked list of users by total winnings. Shows who has earned the most from successful bets.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Entries per page (max 100)',
  })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: TimeFilter,
    example: TimeFilter.ALL_TIME,
    description: 'Time period filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Earners leaderboard retrieved successfully',
    type: LeaderboardResponseDto,
    schema: {
      example: {
        data: [
          {
            rank: 1,
            userId: '123e4567-e89b-12d3-a456-426614174000',
            username: 'profitking',
            firstName: 'Jane',
            lastName: 'Smith',
            avatar: 'https://example.com/avatar2.jpg',
            value: 75000.0,
            metadata: {
              totalWonBets: 450,
              winRate: 72.5,
            },
          },
        ],
        total: 1000,
        page: 1,
        limit: 10,
        totalPages: 100,
        timeFilter: 'all_time',
      },
    },
  })
  async getEarnersLeaderboard(
    @Query() queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardsService.getEarnersLeaderboard(queryDto);
  }

  @Get('streaks')
  @ApiOperation({
    summary: 'Get longest winning streaks leaderboard',
    description:
      'Retrieves a ranked list of users by their longest winning streak. Shows who has had the most consecutive wins.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Entries per page (max 100)',
  })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: TimeFilter,
    example: TimeFilter.ALL_TIME,
    description: 'Time period filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Streaks leaderboard retrieved successfully',
    type: LeaderboardResponseDto,
    schema: {
      example: {
        data: [
          {
            rank: 1,
            userId: '123e4567-e89b-12d3-a456-426614174000',
            username: 'streakmaster',
            firstName: 'Mike',
            lastName: 'Johnson',
            avatar: 'https://example.com/avatar3.jpg',
            value: 25,
            metadata: {
              currentStreak: 15,
              longestStreak: 25,
            },
          },
        ],
        total: 1000,
        page: 1,
        limit: 10,
        totalPages: 100,
        timeFilter: 'all_time',
      },
    },
  })
  async getStreaksLeaderboard(
    @Query() queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardsService.getStreaksLeaderboard(queryDto);
  }

  @Get('predictors')
  @ApiOperation({
    summary: 'Get most accurate predictors leaderboard',
    description:
      'Retrieves a ranked list of users by prediction accuracy (win rate). Shows who makes the best predictions.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Entries per page (max 100)',
  })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: TimeFilter,
    example: TimeFilter.ALL_TIME,
    description: 'Time period filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Predictors leaderboard retrieved successfully',
    type: LeaderboardResponseDto,
    schema: {
      example: {
        data: [
          {
            rank: 1,
            userId: '123e4567-e89b-12d3-a456-426614174000',
            username: 'oracle',
            firstName: 'Sarah',
            lastName: 'Williams',
            avatar: 'https://example.com/avatar4.jpg',
            value: 85.5,
            metadata: {
              totalPredictions: 200,
              correctPredictions: 171,
              winRate: 85.5,
            },
          },
        ],
        total: 1000,
        page: 1,
        limit: 10,
        totalPages: 100,
        timeFilter: 'all_time',
      },
    },
  })
  async getPredictorsLeaderboard(
    @Query() queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardsService.getPredictorsLeaderboard(queryDto);
  }
}
