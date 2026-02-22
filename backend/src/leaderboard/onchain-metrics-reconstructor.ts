export interface MetricsUpdatedEvent {
  userAddress: string;
  ledgerSequence: number;
  txIndex: number;
  eventIndex: number;
  totalStaked: string;
  totalWon: string;
  totalLost: string;
}

export interface CanonicalUserMetrics {
  userAddress: string;
  totalStaked: string;
  totalWon: string;
  totalLost: string;
  ledgerSequence: number;
  txIndex: number;
  eventIndex: number;
}

function isLaterEvent(
  current: CanonicalUserMetrics,
  candidate: MetricsUpdatedEvent,
): boolean {
  if (candidate.ledgerSequence !== current.ledgerSequence) {
    return candidate.ledgerSequence > current.ledgerSequence;
  }
  if (candidate.txIndex !== current.txIndex) {
    return candidate.txIndex > current.txIndex;
  }
  return candidate.eventIndex > current.eventIndex;
}

export function reconstructCanonicalUserMetrics(
  events: MetricsUpdatedEvent[],
): CanonicalUserMetrics[] {
  const latestByUser = new Map<string, CanonicalUserMetrics>();

  for (const event of events) {
    const existing = latestByUser.get(event.userAddress);

    if (!existing || isLaterEvent(existing, event)) {
      latestByUser.set(event.userAddress, {
        userAddress: event.userAddress,
        totalStaked: event.totalStaked,
        totalWon: event.totalWon,
        totalLost: event.totalLost,
        ledgerSequence: event.ledgerSequence,
        txIndex: event.txIndex,
        eventIndex: event.eventIndex,
      });
    }
  }

  return [...latestByUser.values()].sort((a, b) =>
    a.userAddress.localeCompare(b.userAddress),
  );
}
