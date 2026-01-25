import { SpinOutcome } from '../entities/spin.entity';

export class SpinResultDto {
  id: string;
  outcome: SpinOutcome;
  payoutAmount: number;
  stakeAmount: number;
  netResult: number; // payoutAmount - stakeAmount
  timestamp: Date;
}