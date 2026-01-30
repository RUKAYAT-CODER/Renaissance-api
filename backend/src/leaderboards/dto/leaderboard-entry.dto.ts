import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaderboardEntryDto {
  @ApiProperty({
    description: 'User rank position',
    example: 1,
  })
  rank: number;

  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe123',
    nullable: true,
  })
  username: string | null;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    nullable: true,
  })
  firstName: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    nullable: true,
  })
  lastName: string | null;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatars/johndoe.jpg',
    nullable: true,
  })
  avatar: string | null;

  @ApiProperty({
    description:
      'The metric value being ranked (e.g., total staked, earnings, streak count)',
    example: 15000.5,
  })
  value: number;

  @ApiPropertyOptional({
    description: 'Additional context and statistics',
    example: { totalPredictions: 150, winRate: 68.5 },
  })
  metadata?: Record<string, any>;
}

export class LeaderboardResponseDto {
  @ApiProperty({
    description: 'Array of leaderboard entries',
    type: [LeaderboardEntryDto],
  })
  data: LeaderboardEntryDto[];

  @ApiProperty({
    description: 'Total number of entries',
    example: 500,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Entries per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 50,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Time filter applied',
    example: 'all_time',
  })
  timeFilter: string;
}
