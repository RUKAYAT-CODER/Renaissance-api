import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpinController } from './spin.controller';
import { SpinService } from './spin.service';
import { SpinSessionService } from './spin-session.service';
import { Spin } from './entities/spin.entity';
import { SpinSession } from './entities/spin-session.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Transaction } from '../transactions/entities/transaction.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Spin, SpinSession, Transaction]),
    WalletModule,
  ],
  controllers: [SpinController],
  providers: [SpinService, SpinSessionService],
  exports: [SpinService, SpinSessionService],
})
export class SpinModule {}
