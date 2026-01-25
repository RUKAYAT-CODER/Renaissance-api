import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardsService } from './leaderboards.service';
import { LeaderboardQueryDto, LeaderboardResponseDto } from './dto';

@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  @Get('stakers')
  async getStakersLeaderboard(
    @Query() queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardsService.getStakersLeaderboard(queryDto);
  }

  @Get('earners')
  async getEarnersLeaderboard(
    @Query() queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardsService.getEarnersLeaderboard(queryDto);
  }

  @Get('streaks')
  async getStreaksLeaderboard(
    @Query() queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardsService.getStreaksLeaderboard(queryDto);
  }

  @Get('predictors')
  async getPredictorsLeaderboard(
    @Query() queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    return this.leaderboardsService.getPredictorsLeaderboard(queryDto);
  }
}
