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
} from '@nestjs/common';
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

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

@Controller('bets')
@UseGuards(JwtAuthGuard)
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  /**
   * Place a bet on a match
   * POST /bets
   */
  @Post()
  async placeBet(
    @Req() req: AuthenticatedRequest,
    @Body() createBetDto: CreateBetDto,
  ): Promise<Bet> {
    return this.betsService.placeBet(req.user.userId, createBetDto);
  }

  /**
   * Get current user's bets with pagination
   * GET /bets/my-bets
   */
  @Get('my-bets')
  async getMyBets(
    @Req() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedBets> {
    return this.betsService.getUserBets(req.user.userId, page, limit);
  }

  /**
   * Get current user's betting statistics
   * GET /bets/my-stats
   */
  @Get('my-stats')
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

  /**
   * Get bets for a specific match with pagination
   * GET /bets/match/:matchId
   */
  @Get('match/:matchId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async getMatchBets(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedBets> {
    return this.betsService.getMatchBets(matchId, page, limit);
  }

  /**
   * Get a specific bet by ID
   * GET /bets/:betId
   */
  @Get(':betId')
  @UseGuards(OwnershipGuard({ entity: Bet, ownerField: 'user' }))
  async getBetById(
    @Param('betId', ParseUUIDPipe) betId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Bet> {
    return this.betsService.getBetById(betId, req.user.userId);
  }

  /**
   * Update bet status (admin only)
   * PATCH /bets/:betId/status
   */
  @Patch(':betId/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateBetStatus(
    @Param('betId', ParseUUIDPipe) betId: string,
    @Body() updateBetStatusDto: UpdateBetStatusDto,
  ): Promise<Bet> {
    return this.betsService.updateBetStatus(betId, updateBetStatusDto);
  }

  /**
   * Settle all bets for a match (admin only)
   * POST /bets/settle
   */
  @Post('settle')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async settleMatchBets(
    @Body() settleMatchBetsDto: SettleMatchBetsDto,
  ): Promise<{ settled: number; won: number; lost: number }> {
    return this.betsService.settleMatchBets(settleMatchBetsDto.matchId);
  }

  /**
   * Cancel a bet (owner or admin)
   * PATCH /bets/:betId/cancel
   */
  @Patch(':betId/cancel')
  @UseGuards(OwnershipGuard({ entity: Bet, ownerField: 'user' }))
  async cancelBet(
    @Param('betId', ParseUUIDPipe) betId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Bet> {
    return this.betsService.cancelBet(betId, req.user.userId, false);
  }

  /**
   * Get bets for a specific user (admin only)
   * GET /bets/user/:userId
   */
  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserBets(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedBets> {
    return this.betsService.getUserBets(userId, page, limit);
  }
}
