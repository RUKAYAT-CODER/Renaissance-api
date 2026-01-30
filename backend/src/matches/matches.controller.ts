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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { HttpCacheInterceptor } from '../common/cache/interceptors/http-cache.interceptor';
import { CacheKey } from '../common/cache/decorators/cache-key.decorator';
import { NoCache } from '../common/cache/decorators/no-cache.decorator';
import { MatchesService, PaginatedMatches } from './matches.service';
import { Match, MatchStatus } from './entities/match.entity';
import { CreateMatchDto, UpdateMatchDto, UpdateMatchStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Matches')
@Controller('matches')
@UseInterceptors(HttpCacheInterceptor)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new match (Admin only)',
    description:
      'Creates a new match with teams, start time, odds, and other details',
  })
  @ApiBody({ type: CreateMatchDto })
  @ApiResponse({
    status: 201,
    description: 'Match successfully created',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool FC',
        startTime: '2024-02-15T18:00:00Z',
        status: 'scheduled',
        league: 'Premier League',
        season: '2023-2024',
        homeOdds: 1.85,
        drawOdds: 3.2,
        awayOdds: 2.1,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires admin role',
  })
  async createMatch(@Body() createMatchDto: CreateMatchDto): Promise<Match> {
    return this.matchesService.createMatch(createMatchDto);
  }

  @Get()
  @CacheKey('matches')
  @ApiOperation({
    summary: 'Get all matches with filters',
    description:
      'Retrieves a paginated list of matches with optional filtering by status, league, season, teams, and date range',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: MatchStatus,
    description: 'Filter by match status',
  })
  @ApiQuery({
    name: 'league',
    required: false,
    type: String,
    description: 'Filter by league name',
    example: 'Premier League',
  })
  @ApiQuery({
    name: 'season',
    required: false,
    type: String,
    description: 'Filter by season',
    example: '2023-2024',
  })
  @ApiQuery({
    name: 'homeTeam',
    required: false,
    type: String,
    description: 'Filter by home team name',
    example: 'Manchester United',
  })
  @ApiQuery({
    name: 'awayTeam',
    required: false,
    type: String,
    description: 'Filter by away team name',
    example: 'Liverpool FC',
  })
  @ApiQuery({
    name: 'startTimeFrom',
    required: false,
    type: String,
    description: 'Filter matches starting from this date (ISO 8601)',
    example: '2024-02-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'startTimeTo',
    required: false,
    type: String,
    description: 'Filter matches starting before this date (ISO 8601)',
    example: '2024-02-28T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matches retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            homeTeam: 'Manchester United',
            awayTeam: 'Liverpool FC',
            startTime: '2024-02-15T18:00:00Z',
            status: 'scheduled',
            league: 'Premier League',
          },
        ],
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
      },
    },
  })
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

    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key],
    );

    return this.matchesService.getMatches(page, limit, filters);
  }

  @Get('upcoming')
  @CacheKey('matches-upcoming')
  @ApiOperation({
    summary: 'Get upcoming matches',
    description: 'Retrieves matches that are scheduled to start in the future',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Upcoming matches retrieved successfully',
  })
  async getUpcomingMatches(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedMatches> {
    return this.matchesService.getUpcomingMatches(page, limit);
  }

  @Get('live')
  @CacheKey('matches-live')
  @ApiOperation({
    summary: 'Get live matches',
    description: 'Retrieves all matches currently in progress',
  })
  @ApiResponse({
    status: 200,
    description: 'Live matches retrieved successfully',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          homeTeam: 'Manchester United',
          awayTeam: 'Liverpool FC',
          status: 'in_progress',
          homeScore: 1,
          awayScore: 1,
        },
      ],
    },
  })
  async getLiveMatches(): Promise<Match[]> {
    return this.matchesService.getLiveMatches();
  }

  @Get('finished')
  @CacheKey('matches-finished')
  @ApiOperation({
    summary: 'Get finished matches',
    description: 'Retrieves matches that have been completed',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Finished matches retrieved successfully',
  })
  async getFinishedMatches(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedMatches> {
    return this.matchesService.getFinishedMatches(page, limit);
  }

  @Get(':id')
  @CacheKey('matches-single')
  @ApiOperation({
    summary: 'Get a specific match by ID',
    description: 'Retrieves detailed information about a single match',
  })
  @ApiParam({
    name: 'id',
    description: 'Match UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Match found',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool FC',
        startTime: '2024-02-15T18:00:00Z',
        status: 'finished',
        homeScore: 2,
        awayScore: 1,
        outcome: 'home_win',
        league: 'Premier League',
        season: '2023-2024',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Match not found',
  })
  async getMatchById(@Param('id', ParseUUIDPipe) id: string): Promise<Match> {
    return this.matchesService.getMatchById(id);
  }

  @Patch(':id')
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a match (Admin only)',
    description:
      'Updates match details including teams, time, odds, and scores',
  })
  @ApiParam({
    name: 'id',
    description: 'Match UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateMatchDto })
  @ApiResponse({
    status: 200,
    description: 'Match successfully updated',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Match not found',
  })
  async updateMatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMatchDto: UpdateMatchDto,
  ): Promise<Match> {
    return this.matchesService.updateMatch(id, updateMatchDto);
  }

  @Patch(':id/status')
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update match status and scores (Admin only)',
    description:
      'Updates the match status (e.g., in_progress, finished) along with scores and outcome',
  })
  @ApiParam({
    name: 'id',
    description: 'Match UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateMatchStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Match status successfully updated',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Match not found',
  })
  async updateMatchStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateMatchStatusDto,
  ): Promise<Match> {
    return this.matchesService.updateMatchStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel/Delete a match (Admin only)',
    description: 'Cancels or deletes a match from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'Match UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Match successfully deleted',
    schema: {
      example: {
        message: 'Match successfully deleted',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Match not found',
  })
  async deleteMatch(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.matchesService.deleteMatch(id);
  }
}
