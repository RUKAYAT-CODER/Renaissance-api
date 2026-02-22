import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreeBetVouchersController } from './free-bet-vouchers.controller';
import { FreeBetVoucherService } from './free-bet-vouchers.service';
import { FreeBetVoucher } from './entities/free-bet-voucher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FreeBetVoucher])],
  controllers: [FreeBetVouchersController],
  providers: [FreeBetVoucherService],
  exports: [FreeBetVoucherService],
})
export class FreeBetVouchersModule {}
