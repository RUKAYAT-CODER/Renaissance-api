import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LeaderboardStats, LeaderboardPeriod } from './entities/leaderboard-stats.entity';
import { Bet, BetStatus } from '../bets/entities/bet.entity';
import * as moment from 'moment';

@Injectable()
export class LeaderboardService {
    constructor(
        @InjectRepository(LeaderboardStats)
        private readonly statsRepository: Repository<LeaderboardStats>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Updates leaderboard stats for a user after a bet is settled.
     * This should be called transactionally or be idempotent.
     */
    async updateStatsAfterBetSettlement(bet: Bet) {
        if (bet.status !== BetStatus.WON && bet.status !== BetStatus.LOST) {
            return; // Only process settled bets
        }

        const periods = this.getPeriodsForDate(bet.settledAt || new Date());

        // Execute updates for all periods within a transaction to ensure consistency
        await this.dataSource.transaction(async (manager) => {
            const statsRepo = manager.getRepository(LeaderboardStats);

            for (const p of periods) {
                await this.upsertAndCalculate(statsRepo, bet, p.period, p.id);
            }
        });
    }

    private getPeriodsForDate(date: Date): { period: LeaderboardPeriod; id: string }[] {
        const m = moment(date);
        return [
            { period: LeaderboardPeriod.ALL_TIME, id: 'GLOBAL' },
            { period: LeaderboardPeriod.MONTHLY, id: m.format('YYYY-MM') },
            { period: LeaderboardPeriod.WEEKLY, id: m.format('YYYY-[W]WW') },
        ];
    }

    private async upsertAndCalculate(
        repo: Repository<LeaderboardStats>,
        bet: Bet,
        period: LeaderboardPeriod,
        timeframeId: string,
    ) {
        // 1. Find existing stats or create new
        let stats = await repo.findOne({
            where: { userId: bet.userId, period, timeframeId },
        });

        if (!stats) {
            stats = repo.create({
                userId: bet.userId,
                period,
                timeframeId,
                totalStaked: 0,
                totalNetEarnings: 0,
                totalWon: 0,
                totalLost: 0,
                totalSettled: 0,
                currentStreak: 0,
                longestStreak: 0,
            });
        }

        // 2. Calculate Deltas
        // Note: JS numbers have precision issues. For production finance, use a library like decimal.js.
        // Here we assume standard number behavior for simplicity as per the current codebase style.
        const stake = Number(bet.stakeAmount);
        const payout = Number(bet.potentialPayout);

        // Net Earnings:
        // If WON: (Payout - Stake)
        // If LOST: (-Stake)
        const earningsDelta = bet.status === BetStatus.WON ? (payout - stake) : -stake;

        // 3. Update Counts and Amounts
        stats.totalStaked = Number(stats.totalStaked) + stake;
        stats.totalNetEarnings = Number(stats.totalNetEarnings) + earningsDelta;
        stats.totalSettled += 1;

        if (bet.status === BetStatus.WON) {
            stats.totalWon += 1;
            stats.currentStreak += 1;
        } else {
            stats.totalLost += 1;
            stats.currentStreak = 0; // Reset streak on loss
        }

        // Update longest streak
        if (stats.currentStreak > stats.longestStreak) {
            stats.longestStreak = stats.currentStreak;
        }

        stats.lastUpdated = new Date();

        await repo.save(stats);
    }

    /**
     * Retrieves the leaderboard for a specific period.
     */
    async getLeaderboard(period: LeaderboardPeriod, timeframeId?: string, limit: number = 50) {
        if (!timeframeId) {
            // Default to current timeframe if not provided
            const m = moment();
            if (period === LeaderboardPeriod.MONTHLY) timeframeId = m.format('YYYY-MM');
            else if (period === LeaderboardPeriod.WEEKLY) timeframeId = m.format('YYYY-[W]WW');
            else timeframeId = 'GLOBAL';
        }

        return this.statsRepository.find({
            where: { period, timeframeId },
            order: { totalNetEarnings: 'DESC' }, // Default ranking by earnings
            take: limit,
            relations: ['user'], // Include user profile data
        });
    }
}
