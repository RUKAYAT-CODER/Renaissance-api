import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { CacheConfigModule } from 'src/common/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), CacheConfigModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [TypeOrmModule, MatchesService],
})
export class MatchesModule {}
