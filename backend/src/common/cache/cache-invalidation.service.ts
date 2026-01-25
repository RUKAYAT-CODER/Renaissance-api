import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheInvalidationService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Invalidate a specific key
   */
  async invalidateKey(key: string): Promise<void> {
    await (this.cacheManager as any).del(key);
  }

  /**
   * Invalidate all keys matching a pattern
   * Note: This is an expensive operation and should be used with caution
   * Implementation depends on the underlying store
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await (this.cacheManager as any).store.keys(pattern);
    if (keys.length > 0) {
      await (this.cacheManager as any).store.mdel(...keys);
    }
  }

  /**
   * Clear the entire cache
   */
  async clearAll(): Promise<void> {
    await (this.cacheManager as any).reset();
  }
}
