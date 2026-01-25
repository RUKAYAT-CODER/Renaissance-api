import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum SpinStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum SpinOutcome {
  JACKPOT = 'jackpot',
  HIGH_WIN = 'high_win',
  MEDIUM_WIN = 'medium_win',
  SMALL_WIN = 'small_win',
  NO_WIN = 'no_win'
}

@Entity('spins')
@Index(['userId', 'createdAt'])
@Index(['sessionId'], { unique: true })
export class Spin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column('varchar', { length: 255, unique: true })
  sessionId: string; // Unique session identifier to prevent replays

  @Column('decimal', { precision: 10, scale: 2 })
  stakeAmount: number;

  @Column('enum', { enum: SpinOutcome })
  outcome: SpinOutcome;

  @Column('decimal', { precision: 10, scale: 2 })
  payoutAmount: number;

  @Column('enum', { enum: SpinStatus, default: SpinStatus.PENDING })
  status: SpinStatus;

  @Column('jsonb', { nullable: true })
  metadata: {
    randomSeed?: string;
    weightedProbabilities?: Record<string, number>;
    clientTimestamp?: Date;
    serverTimestamp?: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}