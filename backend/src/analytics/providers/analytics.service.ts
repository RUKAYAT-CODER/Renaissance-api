import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DateRangeDto } from '../dto/date-range.dto';
// import { DateRangeDto } from './dto/date-range.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,

    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    
  ) {}

  private buildDateFilter(dateRange: DateRangeDto) {
    if (!dateRange.startDate || !dateRange.endDate) return {};

    return {
      createdAt: {
        gte: new Date(dateRange.startDate),
        lte: new Date(dateRange.endDate),
      },
    };
  }

  async totalStaked(dateRange: DateRangeDto) {
    const cacheKey = `total_staked_${JSON.stringify(dateRange)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await this.prisma.stake.aggregate({
      _sum: { amount: true },
      where: this.buildDateFilter(dateRange),
    });

    await this.cacheManager.set(cacheKey, result, 60);
    return result;
  }

  async spinRevenue(dateRange: DateRangeDto) {
    const cacheKey = `spin_revenue_${JSON.stringify(dateRange)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await this.prisma.spin.aggregate({
      _sum: {
        revenue: true,
        payout: true,
      },
      where: this.buildDateFilter(dateRange),
    });

    await this.cacheManager.set(cacheKey, result, 60);
    return result;
  }

  async mostPopularNFTs() {
    return this.prisma.mint.groupBy({
      by: ['nftId'],
      _count: {
        nftId: true,
      },
      orderBy: {
        _count: {
          nftId: 'desc',
        },
      },
      take: 10,
    });
  }

  async betSettlementStats(dateRange: DateRangeDto) {
    return this.prisma.bet.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      where: this.buildDateFilter(dateRange),
    });
  }
}