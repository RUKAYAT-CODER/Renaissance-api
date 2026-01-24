import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpinController } from './spin.controller';
import { SpinService } from './spin.service';
import { Spin } from './entities/spin.entity';
import { WalletService } from '../wallet/wallet.service';
import { Transaction } from '../transactions/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Spin, Transaction]),
  ],
  controllers: [SpinController],
  providers: [SpinService, WalletService],
  exports: [SpinService],
})
export class SpinModule {}