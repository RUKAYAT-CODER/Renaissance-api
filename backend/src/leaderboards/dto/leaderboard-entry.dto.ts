export class LeaderboardEntryDto {
  rank: number;
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  value: number; // The metric being ranked (staked amount, earnings, streak, accuracy)
  metadata?: Record<string, any>; // Additional context (e.g., total predictions, win rate)
}

export class LeaderboardResponseDto {
  data: LeaderboardEntryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  timeFilter: string;
}
