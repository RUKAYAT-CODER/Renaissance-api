import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contract_event_checkpoints')
@Index(['lastLedger'])
export class ContractEventCheckpoint {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cursor: string | null;

  @Column({ name: 'last_ledger', type: 'int', default: 0 })
  lastLedger: number;

  @Column({ name: 'last_polled_at', type: 'timestamp', nullable: true })
  lastPolledAt: Date | null;

  @Column({ name: 'last_event_at', type: 'timestamp', nullable: true })
  lastEventAt: Date | null;

  @Column({ name: 'reconnect_count', type: 'int', default: 0 })
  reconnectCount: number;

  @Column({ name: 'total_processed', type: 'bigint', default: 0 })
  totalProcessed: number;

  @Column({ name: 'total_skipped', type: 'bigint', default: 0 })
  totalSkipped: number;

  @Column({ name: 'total_failed', type: 'bigint', default: 0 })
  totalFailed: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
