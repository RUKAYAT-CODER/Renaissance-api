/**
 * Domain event emitted when a spin is settled
 * Triggers leaderboard stats update and frontend notifications
 */
export class SpinSettledEvent {
  constructor(
    public readonly userId: string,
    public readonly spinId: string,
    public readonly outcome: string,
    public readonly stakeAmount: number,
    public readonly payoutAmount: number,
    public readonly isWin: boolean,
    public readonly timestamp: Date = new Date(),
  ) {}
}
