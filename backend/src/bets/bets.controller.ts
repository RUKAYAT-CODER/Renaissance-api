import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
  HttpCode,
  HttpStatus,
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
import { Request } from 'express';
import { BetsService, PaginatedBets } from './bets.service';
import { CreateBetDto } from './dto/create-bet.dto';
import {
  UpdateBetStatusDto,
  SettleMatchBetsDto,
} from './dto/update-bet-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { UserRole } from '../users/entities/user.entity';
import { Bet } from './entities/bet.entity';
import { CriticalAction } from '../common/decorators/critical-action.decorator';
import { RateLimitInteractionGuard } from '../rate-limit/guards/rate-limit-interaction.guard';
import { RateLimitAction } from '../rate-limit/decorators/rate-limit-action.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

@ApiTags('Bets')
@Controller('bets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Post()
  @CriticalAction('bets.place')
  @UseGuards(RateLimitInteractionGuard)
  @RateLimitAction('stake')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Place a bet on a match',
    description:
      'Creates a new bet for the authenticated user on a specific match. Optionally use a free bet voucher.',
  })
  @ApiBody({ type: CreateBetDto })
  @ApiResponse({
    status: 201,
    description: 'Bet successfully placed',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e12b-34d5-a678-901234567890',
        matchId: '789e0123-e45b-67d8-a901-234567890123',
        stakeAmount: 100.5,
        predictedOutcome: 'home_win',
        odds: 2.5,
        potentialPayout: 251.25,
        status: 'pending',
        createdAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or insufficient funds',
    schema: {
      example: {
        statusCode: 400,
        message: 'Insufficient balance to place bet',
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
  async placeBet(
    @Req() req: AuthenticatedRequest,
    @Body() createBetDto: CreateBetDto,
  ): Promise<Bet> {
    return this.betsService.placeBet(req.user.userId, createBetDto);
  }

  @Get('my-bets')
  @ApiOperation({
    summary: 'Get current user bets',
    description:
      'Retrieves a paginated list of all bets placed by the authenticated user',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'User bets retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            matchId: '789e0123-e45b-67d8-a901-234567890123',
            stakeAmount: 100.5,
            predictedOutcome: 'home_win',
            odds: 2.5,
            potentialPayout: 251.25,
            status: 'pending',
          },
        ],
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  async getMyBets(
    @Req() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedBets> {
    return this.betsService.getUserBets(req.user.userId, page, limit);
  }

  @Get('my-stats')
  @ApiOperation({
    summary: 'Get current user betting statistics',
    description:
      'Retrieves comprehensive betting statistics for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Betting statistics retrieved successfully',
    schema: {
      example: {
        totalBets: 150,
        pendingBets: 25,
        wonBets: 85,
        lostBets: 35,
        cancelledBets: 5,
        totalStaked: 15000.0,
        totalWon: 18500.0,
        winRate: 68.0,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  async getMyBettingStats(@Req() req: AuthenticatedRequest): Promise<{
    totalBets: number;
    pendingBets: number;
    wonBets: number;
    lostBets: number;
    cancelledBets: number;
    totalStaked: number;
    totalWon: number;
    winRate: number;
  }> {
    return this.betsService.getUserBettingStats(req.user.userId);
  }

  @Get('match/:matchId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({
    summary: 'Get all bets for a specific match (Admin/Moderator only)',
    description:
      'Retrieves a paginated list of all bets placed on a specific match. Requires admin or moderator role.',
  })
  @ApiParam({
    name: 'matchId',
    description: 'Match UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Match bets retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires admin or moderator role',
  })
  @ApiResponse({
    status: 404,
    description: 'Match not found',
  })
  async getMatchBets(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedBets> {
    return this.betsService.getMatchBets(matchId, page, limit);
  }

  @Get(':betId')
  @UseGuards(OwnershipGuard({ entity: Bet, ownerField: 'user' }))
  @ApiOperation({
    summary: 'Get a specific bet by ID',
    description:
      'Retrieves detailed information about a specific bet. User can only access their own bets.',
  })
  @ApiParam({
    name: 'betId',
    description: 'Bet UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Bet found',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e12b-34d5-a678-901234567890',
        matchId: '789e0123-e45b-67d8-a901-234567890123',
        stakeAmount: 100.5,
        predictedOutcome: 'home_win',
        odds: 2.5,
        potentialPayout: 251.25,
        status: 'pending',
        createdAt: '2024-01-15T10:30:00Z',
        match: {
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          startTime: '2024-01-20T18:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only access own bets',
  })
  @ApiResponse({
    status: 404,
    description: 'Bet not found',
  })
  async getBetById(
    @Param('betId', ParseUUIDPipe) betId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Bet> {
    return this.betsService.getBetById(betId, req.user.userId);
  }

  @Patch(':betId/status')
  @CriticalAction('bets.update_status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update bet status (Admin only)',
    description:
      'Manually updates the status of a bet. Restricted to admins only.',
  })
  @ApiParam({
    name: 'betId',
    description: 'Bet UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateBetStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Bet status successfully updated',
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
    description: 'Bet not found',
  })
  async updateBetStatus(
    @Param('betId', ParseUUIDPipe) betId: string,
    @Body() updateBetStatusDto: UpdateBetStatusDto,
  ): Promise<Bet> {
    return this.betsService.updateBetStatus(betId, updateBetStatusDto);
  }

  @Post('settle')
  @CriticalAction('bets.settle')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Settle all bets for a match (Admin only)',
    description:
      'Automatically settles all pending bets for a completed match based on the match outcome',
  })
  @ApiBody({ type: SettleMatchBetsDto })
  @ApiResponse({
    status: 200,
    description: 'Bets successfully settled',
    schema: {
      example: {
        settled: 150,
        won: 85,
        lost: 65,
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
  async settleMatchBets(
    @Body() settleMatchBetsDto: SettleMatchBetsDto,
  ): Promise<{ settled: number; won: number; lost: number }> {
    return this.betsService.settleMatchBets(settleMatchBetsDto.matchId);
  }

  @Patch(':betId/cancel')
  @CriticalAction('bets.cancel')
  @UseGuards(OwnershipGuard({ entity: Bet, ownerField: 'user' }))
  @ApiOperation({
    summary: 'Cancel a bet',
    description:
      'Cancels a pending bet. User can only cancel their own bets. Refunds the stake amount.',
  })
  @ApiParam({
    name: 'betId',
    description: 'Bet UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Bet successfully cancelled',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'cancelled',
        stakeAmount: 100.5,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - bet cannot be cancelled (e.g., already settled)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only cancel own bets',
  })
  @ApiResponse({
    status: 404,
    description: 'Bet not found',
  })
  async cancelBet(
    @Param('betId', ParseUUIDPipe) betId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Bet> {
    return this.betsService.cancelBet(betId, req.user.userId, false);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get bets for a specific user (Admin only)',
    description:
      'Retrieves a paginated list of all bets placed by a specific user. Admin access only.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User UUID',
    example: '456e7890-e12b-34d5-a678-901234567890',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'User bets retrieved successfully',
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
    description: 'User not found',
  })
  async getUserBets(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedBets> {
    return this.betsService.getUserBets(userId, page, limit);
  }
}
