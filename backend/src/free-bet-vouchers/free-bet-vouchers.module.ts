import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreeBetVouchersController } from './free-bet-vouchers.controller';
import { FreeBetVoucherService } from './free-bet-vouchers.service';
import { FreeBetVoucher } from './entities/free-bet-voucher.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FreeBetVoucher, User])],
  controllers: [FreeBetVouchersController],
  providers: [FreeBetVoucherService],
  exports: [FreeBetVoucherService],
})
export class FreeBetVouchersModule {}
