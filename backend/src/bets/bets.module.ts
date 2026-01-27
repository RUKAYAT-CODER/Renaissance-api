import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetsController } from './bets.controller';
import { BetsService } from './bets.service';
import { Bet } from './entities/bet.entity';
import { Match } from '../matches/entities/match.entity';


import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bet, Match]), LeaderboardModule],


import { WalletModule } from '../wallet/wallet.module';

import { FreeBetVouchersModule } from '../free-bet-vouchers/free-bet-vouchers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bet, Match]),
    WalletModule,
    FreeBetVouchersModule,
  ],

  controllers: [BetsController],
  providers: [BetsService],
  exports: [BetsService],
})
export class BetsModule { }
