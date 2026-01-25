import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheInvalidationService } from './cache-invalidation.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const store = configService.get('cache.store');
        const ttl = configService.get('cache.ttl');
        const max = configService.get('cache.max');
        const host = configService.get('redis.host');
        const port = configService.get('redis.port');

        if (store === 'redis') {
          return {
            store: await redisStore({
              socket: {
                host,
                port,
              },
              ttl: ttl * 1000,
            }),
            ttl, // Cache manager uses seconds? default is usually seconds but redis-yet might use ms. Let's use config.
            max,
          };
        }

        return {
          ttl,
          max,
        };
      },
    }),
  ],
  providers: [CacheInvalidationService],
  exports: [CacheModule, CacheInvalidationService],
})
export class CacheConfigModule {}
