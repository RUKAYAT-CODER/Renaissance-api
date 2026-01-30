import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../transactions/entities/transaction.entity';
import {
  Prediction,
  PredictionStatus,
} from '../predictions/entities/prediction.entity';
import { MatchStatus } from '../matches/entities/match.entity';
import {
  LeaderboardQueryDto,
  TimeFilter,
  LeaderboardResponseDto,
  LeaderboardEntryDto,
} from './dto';

@Injectable()
export class LeaderboardsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Prediction)
    private readonly predictionRepository: Repository<Prediction>,
  ) {}

  /**
   * Get date range based on time filter
   */
  private getDateRange(timeFilter: TimeFilter): {
    startDate: Date | null;
    endDate: Date | null;
  } {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (timeFilter) {
      case TimeFilter.WEEKLY:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = now;
        break;
      case TimeFilter.MONTHLY:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = now;
        break;
      case TimeFilter.ALL_TIME:
      default:
        startDate = null;
        endDate = null;
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Get stakers leaderboard - ranked by total staked amount
   */
  async getStakersLeaderboard(
    queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    const { page = 1, limit = 10, timeFilter = TimeFilter.ALL_TIME } = queryDto;
    const { startDate, endDate } = this.getDateRange(timeFilter);

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.userId', 'userId')
      .addSelect('SUM(ABS(transaction.amount))', 'totalStaked')
      .where('transaction.type = :type', {
        type: TransactionType.STAKING_PENALTY,
      })
      .andWhere('transaction.status = :status', {
        status: TransactionStatus.COMPLETED,
      })
      .groupBy('transaction.userId');

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'transaction.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    // Get total count (need to count distinct users)
    const countQuery = this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COUNT(DISTINCT transaction.userId)', 'count')
      .where('transaction.type = :type', {
        type: TransactionType.STAKING_PENALTY,
      })
      .andWhere('transaction.status = :status', {
        status: TransactionStatus.COMPLETED,
      });

    if (startDate && endDate) {
      countQuery.andWhere(
        'transaction.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const totalResult = await countQuery.getRawOne();
    const total = parseInt(totalResult?.count || '0', 10);
    const skip = (page - 1) * limit;

    const stakingResults = await queryBuilder
      .orderBy('totalStaked', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    // Get user details for each result
    const userIds = stakingResults.map((r) => r.userId);
    const users =
      userIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(userIds) },
            select: ['id', 'username', 'firstName', 'lastName', 'avatar'],
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const data: LeaderboardEntryDto[] = stakingResults.map((result, index) => {
      const user = userMap.get(result.userId);
      return {
        rank: skip + index + 1,
        userId: result.userId,
        username: user?.username || null,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        avatar: user?.avatar || null,
        value: parseFloat(result.totalStaked) || 0,
        metadata: {
          totalStaked: parseFloat(result.totalStaked) || 0,
        },
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      timeFilter,
    };
  }

  /**
   * Get earners leaderboard - ranked by total earnings (bet winnings + staking rewards)
   */
  async getEarnersLeaderboard(
    queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    const { page = 1, limit = 10, timeFilter = TimeFilter.ALL_TIME } = queryDto;
    const { startDate, endDate } = this.getDateRange(timeFilter);

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.userId', 'userId')
      .addSelect('SUM(transaction.amount)', 'totalEarnings')
      .where('transaction.type IN (:...types)', {
        types: [TransactionType.BET_WINNING, TransactionType.STAKING_REWARD],
      })
      .andWhere('transaction.status = :status', {
        status: TransactionStatus.COMPLETED,
      })
      .andWhere('transaction.amount > 0')
      .groupBy('transaction.userId');

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'transaction.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    // Get total count (need to count distinct users)
    const countQuery = this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COUNT(DISTINCT transaction.userId)', 'count')
      .where('transaction.type IN (:...types)', {
        types: [TransactionType.BET_WINNING, TransactionType.STAKING_REWARD],
      })
      .andWhere('transaction.status = :status', {
        status: TransactionStatus.COMPLETED,
      })
      .andWhere('transaction.amount > 0');

    if (startDate && endDate) {
      countQuery.andWhere(
        'transaction.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const totalResult = await countQuery.getRawOne();
    const total = parseInt(totalResult?.count || '0', 10);
    const skip = (page - 1) * limit;

    const earningResults = await queryBuilder
      .orderBy('totalEarnings', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    // Get user details
    const userIds = earningResults.map((r) => r.userId);
    const users =
      userIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(userIds) },
            select: ['id', 'username', 'firstName', 'lastName', 'avatar'],
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Get breakdown of earnings by type
    const earningsBreakdown = await Promise.all(
      userIds.map(async (userId) => {
        const betWinningsQuery = this.transactionRepository
          .createQueryBuilder('transaction')
          .select('COALESCE(SUM(transaction.amount), 0)', 'betWinnings')
          .where('transaction.userId = :userId', { userId })
          .andWhere('transaction.type = :type', {
            type: TransactionType.BET_WINNING,
          })
          .andWhere('transaction.status = :status', {
            status: TransactionStatus.COMPLETED,
          })
          .andWhere('transaction.amount > 0');

        const stakingRewardsQuery = this.transactionRepository
          .createQueryBuilder('transaction')
          .select('COALESCE(SUM(transaction.amount), 0)', 'stakingRewards')
          .where('transaction.userId = :userId', { userId })
          .andWhere('transaction.type = :type', {
            type: TransactionType.STAKING_REWARD,
          })
          .andWhere('transaction.status = :status', {
            status: TransactionStatus.COMPLETED,
          })
          .andWhere('transaction.amount > 0');

        if (startDate && endDate) {
          betWinningsQuery.andWhere(
            'transaction.createdAt BETWEEN :startDate AND :endDate',
            {
              startDate,
              endDate,
            },
          );
          stakingRewardsQuery.andWhere(
            'transaction.createdAt BETWEEN :startDate AND :endDate',
            {
              startDate,
              endDate,
            },
          );
        }

        const betWinnings = await betWinningsQuery.getRawOne();
        const stakingRewards = await stakingRewardsQuery.getRawOne();

        return {
          userId,
          betWinnings: parseFloat(betWinnings?.betWinnings || '0'),
          stakingRewards: parseFloat(stakingRewards?.stakingRewards || '0'),
        };
      }),
    );

    const breakdownMap = new Map(
      earningsBreakdown.map((b) => [
        b.userId,
        { betWinnings: b.betWinnings, stakingRewards: b.stakingRewards },
      ]),
    );

    const data: LeaderboardEntryDto[] = earningResults.map((result, index) => {
      const user = userMap.get(result.userId);
      const breakdown = breakdownMap.get(result.userId);
      return {
        rank: skip + index + 1,
        userId: result.userId,
        username: user?.username || null,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        avatar: user?.avatar || null,
        value: parseFloat(result.totalEarnings) || 0,
        metadata: {
          totalEarnings: parseFloat(result.totalEarnings) || 0,
          betWinnings: breakdown?.betWinnings || 0,
          stakingRewards: breakdown?.stakingRewards || 0,
        },
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      timeFilter,
    };
  }

  /**
   * Get streaks leaderboard - ranked by longest consecutive correct predictions
   */
  async getStreaksLeaderboard(
    queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    const { page = 1, limit = 10, timeFilter = TimeFilter.ALL_TIME } = queryDto;
    const { startDate, endDate } = this.getDateRange(timeFilter);

    // Get all predictions with their match outcomes
    const predictionsQuery = this.predictionRepository
      .createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.match', 'match')
      .where('prediction.status IN (:...statuses)', {
        statuses: [PredictionStatus.CORRECT, PredictionStatus.INCORRECT],
      })
      .andWhere('match.status = :matchStatus', {
        matchStatus: MatchStatus.FINISHED,
      })
      .orderBy('prediction.createdAt', 'ASC');

    if (startDate && endDate) {
      predictionsQuery.andWhere(
        'prediction.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const allPredictions = await predictionsQuery.getMany();

    // Group predictions by user and calculate streaks chronologically
    const userPredictions = new Map<string, typeof allPredictions>();

    for (const prediction of allPredictions) {
      if (!userPredictions.has(prediction.userId)) {
        userPredictions.set(prediction.userId, []);
      }
      userPredictions.get(prediction.userId)!.push(prediction);
    }

    const userStreaks = new Map<
      string,
      { currentStreak: number; maxStreak: number }
    >();

    // Calculate streaks for each user
    for (const [userId, predictions] of userPredictions.entries()) {
      // Sort predictions by creation date to ensure chronological order
      const sortedPredictions = predictions.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      let currentStreak = 0;
      let maxStreak = 0;

      for (const prediction of sortedPredictions) {
        if (prediction.status === PredictionStatus.CORRECT) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }

      userStreaks.set(userId, { currentStreak, maxStreak });
    }

    // Convert to array and sort by max streak
    const streakArray = Array.from(userStreaks.entries())
      .map(([userId, streaks]) => ({
        userId,
        maxStreak: streaks.maxStreak,
        currentStreak: streaks.currentStreak,
      }))
      .filter((s) => s.maxStreak > 0)
      .sort((a, b) => b.maxStreak - a.maxStreak);

    const total = streakArray.length;
    const skip = (page - 1) * limit;
    const paginatedStreaks = streakArray.slice(skip, skip + limit);

    // Get user details
    const userIds = paginatedStreaks.map((s) => s.userId);
    const users =
      userIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(userIds) },
            select: ['id', 'username', 'firstName', 'lastName', 'avatar'],
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const data: LeaderboardEntryDto[] = paginatedStreaks.map(
      (streak, index) => {
        const user = userMap.get(streak.userId);
        return {
          rank: skip + index + 1,
          userId: streak.userId,
          username: user?.username || null,
          firstName: user?.firstName || null,
          lastName: user?.lastName || null,
          avatar: user?.avatar || null,
          value: streak.maxStreak,
          metadata: {
            maxStreak: streak.maxStreak,
            currentStreak: streak.currentStreak,
          },
        };
      },
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      timeFilter,
    };
  }

  /**
   * Get predictors leaderboard - ranked by prediction accuracy percentage
   */
  async getPredictorsLeaderboard(
    queryDto: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto> {
    const { page = 1, limit = 10, timeFilter = TimeFilter.ALL_TIME } = queryDto;
    const { startDate, endDate } = this.getDateRange(timeFilter);

    // Get all predictions with their match outcomes
    const predictionsQuery = this.predictionRepository
      .createQueryBuilder('prediction')
      .leftJoinAndSelect('prediction.match', 'match')
      .where('prediction.status IN (:...statuses)', {
        statuses: [PredictionStatus.CORRECT, PredictionStatus.INCORRECT],
      })
      .andWhere('match.status = :matchStatus', {
        matchStatus: MatchStatus.FINISHED,
      });

    if (startDate && endDate) {
      predictionsQuery.andWhere(
        'prediction.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const allPredictions = await predictionsQuery.getMany();

    // Group predictions by user and calculate accuracy
    const userStats = new Map<
      string,
      { correct: number; incorrect: number; total: number; accuracy: number }
    >();

    for (const prediction of allPredictions) {
      if (!userStats.has(prediction.userId)) {
        userStats.set(prediction.userId, {
          correct: 0,
          incorrect: 0,
          total: 0,
          accuracy: 0,
        });
      }

      const stats = userStats.get(prediction.userId)!;
      stats.total++;

      if (prediction.status === PredictionStatus.CORRECT) {
        stats.correct++;
      } else if (prediction.status === PredictionStatus.INCORRECT) {
        stats.incorrect++;
      }
    }

    // Calculate accuracy for each user
    const accuracyArray = Array.from(userStats.entries())
      .map(([userId, stats]) => {
        const accuracy =
          stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        return {
          userId,
          accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
          correct: stats.correct,
          incorrect: stats.incorrect,
          total: stats.total,
        };
      })
      .filter((s) => s.total >= 3) // Minimum 3 predictions to be ranked
      .sort((a, b) => {
        // Sort by accuracy first, then by total predictions (more predictions = better)
        if (Math.abs(a.accuracy - b.accuracy) < 0.01) {
          return b.total - a.total;
        }
        return b.accuracy - a.accuracy;
      });

    const total = accuracyArray.length;
    const skip = (page - 1) * limit;
    const paginatedAccuracy = accuracyArray.slice(skip, skip + limit);

    // Get user details
    const userIds = paginatedAccuracy.map((a) => a.userId);
    const users =
      userIds.length > 0
        ? await this.userRepository.find({
            where: { id: In(userIds) },
            select: ['id', 'username', 'firstName', 'lastName', 'avatar'],
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const data: LeaderboardEntryDto[] = paginatedAccuracy.map(
      (accuracy, index) => {
        const user = userMap.get(accuracy.userId);
        return {
          rank: skip + index + 1,
          userId: accuracy.userId,
          username: user?.username || null,
          firstName: user?.firstName || null,
          lastName: user?.lastName || null,
          avatar: user?.avatar || null,
          value: accuracy.accuracy,
          metadata: {
            accuracy: accuracy.accuracy,
            correct: accuracy.correct,
            incorrect: accuracy.incorrect,
            total: accuracy.total,
            winRate: accuracy.accuracy,
          },
        };
      },
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      timeFilter,
    };
  }
}
