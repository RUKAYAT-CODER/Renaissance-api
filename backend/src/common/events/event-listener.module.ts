import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractEventLog } from './entities/contract-event-log.entity';
import { ContractEventCheckpoint } from './entities/contract-event-checkpoint.entity';
import { EventListenerService } from './event-listener.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ContractEventLog, ContractEventCheckpoint]),
  ],
  providers: [EventListenerService],
  exports: [EventListenerService],
})
export class EventListenerModule {}
