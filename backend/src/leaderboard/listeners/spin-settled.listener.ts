import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { SpinSettledEvent } from '../domain/events';
import { LeaderboardService } from '../leaderboard.service';

@EventsHandler(SpinSettledEvent)
export class SpinSettledEventHandler implements IEventHandler<SpinSettledEvent> {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  async handle(event: SpinSettledEvent): Promise<void> {
    // Delegate to leaderboard service to atomically update stats
    await this.leaderboardService.handleSpinSettled(event);
  }
}
