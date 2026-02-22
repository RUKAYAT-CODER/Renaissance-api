import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../entities/base.entity';

export enum ContractEventType {
  STAKING = 'staking',
  SPIN_REWARD = 'spin_reward',
  NFT_MINT = 'nft_mint',
  BET_SETTLEMENT = 'bet_settlement',
  UNKNOWN = 'unknown',
}

export enum ContractEventStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}

@Entity('contract_event_logs')
@Index(['eventId'], { unique: true })
@Index(['eventType'])
@Index(['status'])
@Index(['ledger'])
@Index(['txHash'])
export class ContractEventLog extends BaseEntity {
  @Column({ name: 'event_id', type: 'varchar', length: 128, unique: true })
  eventId: string;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: ContractEventType,
    enumName: 'contract_event_type_enum',
    default: ContractEventType.UNKNOWN,
  })
  eventType: ContractEventType;

  @Column({ type: 'int' })
  ledger: number;

  @Column({ name: 'tx_hash', type: 'varchar', length: 128, nullable: true })
  txHash: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cursor: string | null;

  @Column({ type: 'jsonb', nullable: true })
  topics: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({
    type: 'enum',
    enum: ContractEventStatus,
    enumName: 'contract_event_status_enum',
    default: ContractEventStatus.PENDING,
  })
  status: ContractEventStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date | null;
}
