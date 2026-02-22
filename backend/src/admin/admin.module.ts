import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EmergencyController } from './emergency.controller';
import { EmergencyPauseService } from './emergency-pause.service';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { SystemControl } from './entities/system-control.entity';
import { Bet } from '../bets/entities/bet.entity';
import { User } from '../users/entities/user.entity';
import { Match } from '../matches/entities/match.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { RateLimitModule } from '../rate-limit/rate-limit.module';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      AdminAuditLog,
      SystemControl,
      Bet,
      User,
      Match,
      Transaction,
    ]),
    RateLimitModule,
  ],
  controllers: [AdminController, EmergencyController],
  providers: [AdminService, EmergencyPauseService],
  exports: [AdminService, EmergencyPauseService],
})
export class AdminModule {}
