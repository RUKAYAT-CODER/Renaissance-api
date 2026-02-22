import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_ACTION_KEY } from '../guards/rate-limit-interaction.guard';
import { InteractionAction } from '../rate-limit-interaction.service';

/**
 * Mark a route as rate-limited for the given interaction action.
 * Use with RateLimitInteractionGuard.
 */
export const RateLimitAction = (action: InteractionAction) =>
  SetMetadata(RATE_LIMIT_ACTION_KEY, action);
