import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { getTypeOrmConfig } from './database/typeorm.config';
import { User } from './users/entities/user.entity';
import { Post } from './posts/entities/post.entity';
import { Comment } from './comments/entities/comment.entity';
import { Category } from './categories/entities/category.entity';
import { Media } from './media/entities/media.entity';
import { Match } from './matches/entities/match.entity';
import { Bet } from './bets/entities/bet.entity';
import { PlayerCardMetadata } from './player-card-metadata/entities/player-card-metadata.entity';
import { Prediction } from './predictions/entities/prediction.entity';
import { FreeBetVoucher } from './free-bet-vouchers/entities/free-bet-voucher.entity';
import { Spin } from './spin/entities/spin.entity';
import { SpinSession } from './spin/entities/spin-session.entity';
import configuration from './config/configuration';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { BetsModule } from './bets/bets.module';
import { MatchesModule } from './matches/matches.module';
import { PlayerCardMetadataModule } from './player-card-metadata/player-card-metadata.module';
import { PostsModule } from './posts/posts.module';
import { PredictionsModule } from './predictions/predictions.module';
import { FreeBetVouchersModule } from './free-bet-vouchers/free-bet-vouchers.module';
import { validate } from './common/config/env.validation';
import { BlockchainModule } from './blockchain/blockchain.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { SpinModule } from './spin/spin.module';
import { AdminModule } from './admin/admin.module';

import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      validate,
      cache: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60000), // 60 seconds
            limit: config.get<number>('THROTTLE_LIMIT', 10), // 10 requests
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
    }),
    TypeOrmModule.forFeature([
      User,
      Post,
      Comment,
      Category,
      Media,
      Match,
      Bet,
      PlayerCardMetadata,
      Prediction,
      FreeBetVoucher,
      Spin,
      SpinSession,
    ]),
    AuthModule,
    BetsModule,
    MatchesModule,
    PlayerCardMetadataModule,
    PostsModule,
    PredictionsModule,
    LeaderboardModule,
    FreeBetVouchersModule,
    SpinModule,
    LeaderboardModule,
    LeaderboardsModule,
    AdminModule,
    ReconciliationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
