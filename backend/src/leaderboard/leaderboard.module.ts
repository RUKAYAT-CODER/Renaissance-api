import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Leaderboard } from './entities/leaderboard.entity';
import { LeaderboardStats } from './entities/leaderboard-stats.entity';
import { UserLeaderboardStats } from './entities/user-leaderboard-stats.entity';
import { LeaderboardService } from './leaderboard.service';
import { User } from '../users/entities/user.entity';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardQueryService } from './leaderboard-query.service';
import { SpinSettledEventHandler } from './listeners/spin-settled.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Leaderboard, LeaderboardStats, UserLeaderboardStats, User]), CqrsModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardQueryService, SpinSettledEventHandler],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
