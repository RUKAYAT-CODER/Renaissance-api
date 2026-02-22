import {
  reconstructCanonicalUserMetrics,
  MetricsUpdatedEvent,
} from './onchain-metrics-reconstructor';

describe('reconstructCanonicalUserMetrics', () => {
  it('uses the latest event per user by ledger, tx, and event ordering', () => {
    const events: MetricsUpdatedEvent[] = [
      {
        userAddress: 'GUSER1',
        ledgerSequence: 100,
        txIndex: 0,
        eventIndex: 0,
        totalStaked: '10',
        totalWon: '0',
        totalLost: '10',
      },
      {
        userAddress: 'GUSER1',
        ledgerSequence: 101,
        txIndex: 0,
        eventIndex: 1,
        totalStaked: '20',
        totalWon: '30',
        totalLost: '10',
      },
      {
        userAddress: 'GUSER2',
        ledgerSequence: 101,
        txIndex: 0,
        eventIndex: 0,
        totalStaked: '5',
        totalWon: '0',
        totalLost: '5',
      },
      {
        userAddress: 'GUSER2',
        ledgerSequence: 101,
        txIndex: 1,
        eventIndex: 0,
        totalStaked: '15',
        totalWon: '25',
        totalLost: '5',
      },
      {
        userAddress: 'GUSER2',
        ledgerSequence: 101,
        txIndex: 1,
        eventIndex: 1,
        totalStaked: '18',
        totalWon: '25',
        totalLost: '8',
      },
    ];

    expect(reconstructCanonicalUserMetrics(events)).toEqual([
      {
        userAddress: 'GUSER1',
        ledgerSequence: 101,
        txIndex: 0,
        eventIndex: 1,
        totalStaked: '20',
        totalWon: '30',
        totalLost: '10',
      },
      {
        userAddress: 'GUSER2',
        ledgerSequence: 101,
        txIndex: 1,
        eventIndex: 1,
        totalStaked: '18',
        totalWon: '25',
        totalLost: '8',
      },
    ]);
  });
});
