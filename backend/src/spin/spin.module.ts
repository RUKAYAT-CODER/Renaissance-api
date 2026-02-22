import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpinController } from './spin.controller';
import { SpinService } from './spin.service';
import { SpinSessionService } from './spin-session.service';
import { Spin } from './entities/spin.entity';
import { SpinSession } from './entities/spin-session.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from 'src/users/entities/user.entity';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { FreeBetVouchersModule } from '../free-bet-vouchers/free-bet-vouchers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Spin, SpinSession, Transaction]),
    WalletModule,
    FreeBetVouchersModule,
    RateLimitModule,
    BlockchainModule,
    CqrsModule,
  ],
  controllers: [SpinController],
  providers: [SpinService, SpinSessionService],
  exports: [SpinService, SpinSessionService],
})
export class SpinModule {}
