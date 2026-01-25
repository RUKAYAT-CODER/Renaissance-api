import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { HttpCacheInterceptor } from '../common/cache/interceptors/http-cache.interceptor';
import { CacheKey } from '../common/cache/decorators/cache-key.decorator';
import { NoCache } from '../common/cache/decorators/no-cache.decorator';
import { MatchesService, PaginatedMatches } from './matches.service';
import { Match, MatchStatus } from './entities/match.entity';
import {
  CreateMatchDto,
  UpdateMatchDto,
  UpdateMatchStatusDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('matches')
@UseInterceptors(HttpCacheInterceptor)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  // Create a new match (Admin only) - No Cache needed
  @Post()
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createMatch(@Body() createMatchDto: CreateMatchDto): Promise<Match> {
    return this.matchesService.createMatch(createMatchDto);
  }

  /**
   * Get all matches with pagination and filters (Public)
   */
  @Get()
  @CacheKey('matches')
  async getMatches(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: MatchStatus,
    @Query('league') league?: string,
    @Query('season') season?: string,
    @Query('homeTeam') homeTeam?: string,
    @Query('awayTeam') awayTeam?: string,
    @Query('startTimeFrom') startTimeFrom?: string,
    @Query('startTimeTo') startTimeTo?: string,
  ): Promise<PaginatedMatches> {
    const filters = {
      status,
      league,
      season,
      homeTeam,
      awayTeam,
      startTimeFrom: startTimeFrom ? new Date(startTimeFrom) : undefined,
      startTimeTo: startTimeTo ? new Date(startTimeTo) : undefined,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key],
    );

    return this.matchesService.getMatches(page, limit, filters);
  }

  /**
   * Get upcoming matches (Public)
   */
  @Get('upcoming')
  @CacheKey('matches-upcoming')
  async getUpcomingMatches(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedMatches> {
    return this.matchesService.getUpcomingMatches(page, limit);
  }

  /**
   * Get live matches (Public)
   * Real-time data, so we might want a shorter TTL or no cache.
   * For now, let's cache but we can adjust TTL in the interceptor if needed,
   * or rely on global TTL.
   */
  @Get('live')
  @CacheKey('matches-live')
  async getLiveMatches(): Promise<Match[]> {
    return this.matchesService.getLiveMatches();
  }

  /**
   * Get finished matches (Public)
   */
  @Get('finished')
  @CacheKey('matches-finished')
  async getFinishedMatches(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedMatches> {
    return this.matchesService.getFinishedMatches(page, limit);
  }

  /**
   * Get a specific match by ID (Public)
   */
  @Get(':id')
  @CacheKey('matches-single')
  async getMatchById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Match> {
    return this.matchesService.getMatchById(id);
  }

  /**
   * Update a match (Admin only)
   */
  @Patch(':id')
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateMatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMatchDto: UpdateMatchDto,
  ): Promise<Match> {
    return this.matchesService.updateMatch(id, updateMatchDto);
  }

  /**
   * Update match status and scores (Admin only)
   */
  @Patch(':id/status')
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateMatchStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateMatchStatusDto,
  ): Promise<Match> {
    return this.matchesService.updateMatchStatus(id, updateStatusDto);
  }

  /**
   * Cancel a match (Admin only)
   */
  @Delete(':id')
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteMatch(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.matchesService.deleteMatch(id);
  }
}
