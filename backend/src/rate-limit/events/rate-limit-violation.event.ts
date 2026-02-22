/**
 * Emitted when a user hits the interaction rate limit (spam / abuse).
 * Fired before rejecting the request so consumers can log or audit.
 */
export class RateLimitViolationEvent {
  constructor(
    public readonly userId: string,
    public readonly action: 'spin' | 'spin_game' | 'stake',
    public readonly requestedAt: Date,
    public readonly cooldownSeconds: number,
    public readonly nextAllowedAt: Date,
  ) {}
}
