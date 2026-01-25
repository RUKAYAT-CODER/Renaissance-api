import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bet, BetStatus } from './entities/bet.entity';
import {
  Match,
  MatchStatus,
  MatchOutcome,
} from '../matches/entities/match.entity';
import { CreateBetDto } from './dto/create-bet.dto';
import { UpdateBetStatusDto } from './dto/update-bet-status.dto';
import { WalletService } from '../wallet/wallet.service';
import { FreeBetVoucherService } from '../free-bet-vouchers/free-bet-vouchers.service';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../transactions/entities/transaction.entity';
import { LeaderboardService } from '../leaderboard/leaderboard.service';

export interface PaginatedBets {
  data: Bet[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class BetsService {
  constructor(
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    private readonly dataSource: DataSource,
    private readonly walletService: WalletService,

    private readonly leaderboardService: LeaderboardService,
  ) { }

    private readonly freeBetVoucherService: FreeBetVoucherService,
  ) {}


  /**
   * Place a bet on a match
   * Uses transaction to ensure atomic operations between wallet deduction and bet creation
   */
  async placeBet(userId: string, createBetDto: CreateBetDto): Promise<Bet> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get the match with lock to prevent race conditions
      const match = await queryRunner.manager.findOne(Match, {
        where: { id: createBetDto.matchId },
        lock: { mode: 'pessimistic_read' },
      });

      if (!match) {
        throw new NotFoundException('Match not found');
      }

      // Validate match status - bets can only be placed on upcoming matches
      if (match.status !== MatchStatus.UPCOMING) {
        throw new BadRequestException(
          `Cannot place bet: Match is ${match.status}. Bets can only be placed on upcoming matches.`,
        );
      }

      // Check if user already has a bet on this match
      const existingBet = await queryRunner.manager.findOne(Bet, {
        where: { userId, matchId: createBetDto.matchId },
      });

      if (existingBet) {
        throw new ConflictException(
          'You have already placed a bet on this match',
        );
      }

      // Resolve free bet voucher if provided. Vouchers: non-withdrawable, betting only, auto-consumed on use.
      let useVoucher = false;
      let voucherId: string | undefined;
      if (createBetDto.voucherId) {
        const voucher =
          await this.freeBetVoucherService.validateVoucher(
            createBetDto.voucherId,
            userId,
          );
        const vAmount = Number(voucher.amount);
        if (Number(createBetDto.stakeAmount) !== vAmount) {
          throw new BadRequestException(
            `Stake amount must equal voucher amount (${vAmount}) when using a free bet voucher`,
          );
        }
        useVoucher = true;
        voucherId = createBetDto.voucherId;
      }

      // Deduct from wallet only when not using a voucher (vouchers cannot be withdrawn)
      if (!useVoucher) {
        const walletResult = await this.walletService.updateUserBalance(
          userId,
          -Number(createBetDto.stakeAmount),
          TransactionType.BET_PLACEMENT,
          undefined,
          {
            matchId: createBetDto.matchId,
            predictedOutcome: createBetDto.predictedOutcome,
          },
        );
        if (!walletResult.success) {
          throw new BadRequestException(
            walletResult.error || 'Failed to deduct stake amount from wallet',
          );
        }
      }

      // Calculate odds and potential payout
      const odds = this.getOddsForOutcome(match, createBetDto.predictedOutcome);
      const potentialPayout = Number(createBetDto.stakeAmount) * Number(odds);

      // Create the bet
      const bet = queryRunner.manager.create(Bet, {
        userId,
        matchId: createBetDto.matchId,
        stakeAmount: createBetDto.stakeAmount,
        predictedOutcome: createBetDto.predictedOutcome,
        odds,
        potentialPayout,
        status: BetStatus.PENDING,
        metadata: useVoucher
          ? { voucherId, isFreeBet: true }
          : undefined,
      });

      const savedBet = await queryRunner.manager.save(bet);

      // Automatically consume voucher on use
      if (useVoucher && voucherId) {
        await this.freeBetVoucherService.consumeVoucher(
          voucherId,
          userId,
          savedBet.id,
        );
      }

      // Link wallet transaction to bet (only when wallet was used)
      if (!useVoucher) {
        const transaction = await queryRunner.manager.findOne(Transaction, {
          where: {
            userId,
            type: TransactionType.BET_PLACEMENT,
            status: TransactionStatus.COMPLETED,
          },
          order: { createdAt: 'DESC' } as any,
        });
        if (transaction) {
          transaction.relatedEntityId = savedBet.id;
          await queryRunner.manager.save(transaction);
        }
      }

      await queryRunner.commitTransaction();

      return savedBet;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get odds for a specific outcome from match
   */
  private getOddsForOutcome(match: Match, outcome: MatchOutcome): number {
    switch (outcome) {
      case MatchOutcome.HOME_WIN:
        return Number(match.homeOdds);
      case MatchOutcome.AWAY_WIN:
        return Number(match.awayOdds);
      case MatchOutcome.DRAW:
        return Number(match.drawOdds);
      default:
        throw new BadRequestException('Invalid outcome');
    }
  }

  /**
   * Get all bets for a user with pagination
   */
  async getUserBets(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedBets> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.betRepository.findAndCount({
      where: { userId },
      relations: ['match'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all bets for a specific match with pagination
   * Optimized to use QueryBuilder for better control over selected fields
   */
  async getMatchBets(
    matchId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedBets> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const skip = (page - 1) * limit;

    // Use QueryBuilder to select only necessary user fields
    const queryBuilder = this.betRepository
      .createQueryBuilder('bet')
      .leftJoinAndSelect('bet.user', 'user')
      .select([
        'bet',
        'user.id',
        'user.email',
        'user.username',
        'user.firstName',
        'user.lastName',
        'user.avatar',
      ])
      .where('bet.matchId = :matchId', { matchId })
      .orderBy('bet.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a specific bet by ID
   */
  async getBetById(betId: string, userId?: string): Promise<Bet> {
    const bet = await this.betRepository.findOne({
      where: { id: betId },
      relations: ['match', 'user'],
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    // If userId is provided, verify ownership
    if (userId && bet.userId !== userId) {
      throw new ForbiddenException('You do not have access to this bet');
    }

    return bet;
  }

  /**
   * Update bet status (admin only)
   * Validates state transitions
   */
  async updateBetStatus(
    betId: string,
    updateBetStatusDto: UpdateBetStatusDto,
  ): Promise<Bet> {
    const bet = await this.betRepository.findOne({
      where: { id: betId },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    // Validate state transition
    this.validateStatusTransition(bet.status, updateBetStatusDto.status);

    // Update the bet
    bet.status = updateBetStatusDto.status;

    if (
      updateBetStatusDto.status === BetStatus.WON ||
      updateBetStatusDto.status === BetStatus.LOST ||
      updateBetStatusDto.status === BetStatus.CANCELLED
    ) {
      bet.settledAt = new Date();
    }

    const savedBet = await this.betRepository.save(bet);

    // Update leaderboard stats asynchronously
    this.leaderboardService.updateStatsAfterBetSettlement(savedBet);

    return savedBet;
  }

  /**
   * Settle all bets for a match based on the match outcome
   * Uses transaction for atomic operations including wallet updates
   */
  async settleMatchBets(matchId: string): Promise<{
    settled: number;
    won: number;
    lost: number;
    totalPayout: number;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get the match
      const match = await queryRunner.manager.findOne(Match, {
        where: { id: matchId },
      });

      if (!match) {
        throw new NotFoundException('Match not found');
      }

      if (match.status !== MatchStatus.FINISHED) {
        throw new BadRequestException(
          'Cannot settle bets: Match is not finished',
        );
      }

      if (!match.outcome) {
        throw new BadRequestException(
          'Cannot settle bets: Match outcome not set',
        );
      }

      // Get all pending bets for this match
      // Use relations to avoid N+1 when accessing user data
      const pendingBets = await queryRunner.manager.find(Bet, {
        where: { matchId, status: BetStatus.PENDING },
      });

      let won = 0;
      let lost = 0;
      let totalPayout = 0;

      // Settle each bet
      for (const bet of pendingBets) {
        if (bet.predictedOutcome === match.outcome) {
          // Winner - distribute payout
          bet.status = BetStatus.WON;
          won++;
          totalPayout += Number(bet.potentialPayout);

          // Credit winnings to user wallet
          await this.walletService.updateUserBalance(
            bet.userId,
            Number(bet.potentialPayout),
            TransactionType.BET_WINNING,
            bet.id,
            {
              matchId: bet.matchId,
              stakeAmount: Number(bet.stakeAmount),
              payoutAmount: Number(bet.potentialPayout),
            },
          );
        } else {
          // Loser - no payout
          bet.status = BetStatus.LOST;
          lost++;
        }
        bet.settledAt = new Date();
        await queryRunner.manager.save(bet);
      }

      await queryRunner.commitTransaction();

      // Update leaderboard stats for all settled bets
      // We run this without awaiting to not block the response, or await if we want to ensure consistency before return.
      // Given the requirement for efficiency, let's await it but handle errors so it doesn't crash.
      for (const bet of pendingBets) {
        try {
          await this.leaderboardService.updateStatsAfterBetSettlement(bet);
        } catch (e) {
          console.error(`Failed to update leaderboard for bet ${bet.id}`, e);
        }
      }

      return {
        settled: pendingBets.length,
        won,
        lost,
        totalPayout,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Process leaderboard updates for settled bets outside of the transaction block
      // We do this here (after release) to ensure we don't hold the connection 
      // but we need the bets data. However, queryRunner is released.
      // Better to do it after commit but before release if we had the data. 
      // Actually we have pendingBets list. We can iterate it.
      // But queryRunner.release() is called in finally.
      // Let's do it before release but inside a try/catch strictly for leaderboard so it doesn't fail the main request.

      // Since transaction is committed, we can safely update leaderboard.
      // We will perform this AFTER the transaction block is fully done (conceptually), but 'finally' runs always.
      // We should check if transaction succeeded, which is hard in finally.
      // Instead, let's move this logic to BEFORE the finally block, right after commit.
      await queryRunner.release();
    }
  }

  /**
   * Cancel a bet (only if still pending)
   * Refunds the stake amount to user wallet
   */
  async cancelBet(
    betId: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<Bet> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const bet = await queryRunner.manager.findOne(Bet, {
        where: { id: betId },
      });

      if (!bet) {
        throw new NotFoundException('Bet not found');
      }

      // Check ownership if not admin
      if (!isAdmin && bet.userId !== userId) {
        throw new ForbiddenException('You do not have access to this bet');
      }

      if (bet.status !== BetStatus.PENDING) {
        throw new ConflictException(
          'Cannot cancel bet: Bet has already been settled',
        );
      }

      // Refund stake amount to user wallet
      await this.walletService.updateUserBalance(
        bet.userId,
        Number(bet.stakeAmount),
        TransactionType.BET_CANCELLATION,
        bet.id,
        {
          matchId: bet.matchId,
          stakeAmount: Number(bet.stakeAmount),
          cancellationReason: isAdmin ? 'admin_cancelled' : 'user_cancelled',
        },
      );

      bet.status = BetStatus.CANCELLED;
      bet.settledAt = new Date();

      const savedBet = await queryRunner.manager.save(bet);

      await queryRunner.commitTransaction();

      return savedBet;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validate bet status transitions
   * PENDING → WON | LOST | CANCELLED (once settled, immutable)
   */
  private validateStatusTransition(
    currentStatus: BetStatus,
    newStatus: BetStatus,
  ): void {
    // If already settled, no further transitions allowed
    if (currentStatus !== BetStatus.PENDING) {
      throw new ConflictException(
        `Cannot change bet status: Bet has already been settled as ${currentStatus}`,
      );
    }

    // From PENDING, can only go to WON, LOST, or CANCELLED
    const validTransitions: BetStatus[] = [
      BetStatus.WON,
      BetStatus.LOST,
      BetStatus.CANCELLED,
    ];

    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Get betting statistics for a user
   * Optimized to use database aggregation instead of loading all bets into memory
   */
  async getUserBettingStats(userId: string): Promise<{
    totalBets: number;
    pendingBets: number;
    wonBets: number;
    lostBets: number;
    cancelledBets: number;
    totalStaked: number;
    totalWon: number;
    winRate: number;
  }> {
    // Use QueryBuilder for efficient aggregation
    const stats = await this.betRepository
      .createQueryBuilder('bet')
      .select('COUNT(*)', 'totalBets')
      .addSelect(
        "SUM(CASE WHEN bet.status = 'pending' THEN 1 ELSE 0 END)",
        'pendingBets',
      )
      .addSelect(
        "SUM(CASE WHEN bet.status = 'won' THEN 1 ELSE 0 END)",
        'wonBets',
      )
      .addSelect(
        "SUM(CASE WHEN bet.status = 'lost' THEN 1 ELSE 0 END)",
        'lostBets',
      )
      .addSelect(
        "SUM(CASE WHEN bet.status = 'cancelled' THEN 1 ELSE 0 END)",
        'cancelledBets',
      )
      .addSelect('SUM(bet.stake_amount)', 'totalStaked')
      .addSelect(
        "SUM(CASE WHEN bet.status = 'won' THEN bet.potential_payout ELSE 0 END)",
        'totalWon',
      )
      .where('bet.userId = :userId', { userId })
      .getRawOne();

    const totalBets = parseInt(stats.totalBets) || 0;
    const wonBets = parseInt(stats.wonBets) || 0;
    const lostBets = parseInt(stats.lostBets) || 0;
    const settledBets = wonBets + lostBets;
    const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0;

    return {
      totalBets,
      pendingBets: parseInt(stats.pendingBets) || 0,
      wonBets,
      lostBets,
      cancelledBets: parseInt(stats.cancelledBets) || 0,
      totalStaked: parseFloat(stats.totalStaked) || 0,
      totalWon: parseFloat(stats.totalWon) || 0,
      winRate,
    };
  }
}
