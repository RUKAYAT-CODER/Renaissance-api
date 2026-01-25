import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LeaderboardStats } from './entities/leaderboard-stats.entity';
import { LeaderboardService } from './leaderboard.service';

@Module({
    imports: [TypeOrmModule.forFeature([LeaderboardStats])],
    providers: [LeaderboardService],
    exports: [LeaderboardService],
})
export class LeaderboardModule { }

import { User } from '../users/entities/user.entity';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardQueryService } from './leaderboard-query.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [LeaderboardController],
  providers: [LeaderboardQueryService],
})
export class LeaderboardModule {}

