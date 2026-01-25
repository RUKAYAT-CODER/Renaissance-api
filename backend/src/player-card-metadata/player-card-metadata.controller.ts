import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { HttpCacheInterceptor } from '../common/cache/interceptors/http-cache.interceptor';
import { CacheKey } from '../common/cache/decorators/cache-key.decorator';
import { NoCache } from '../common/cache/decorators/no-cache.decorator';
import { Request } from 'express';
import { PlayerCardMetadataService, PaginatedPlayerCardMetadata } from './player-card-metadata.service';
import { PlayerCardMetadata } from './entities/player-card-metadata.entity';
import {
  CreatePlayerCardMetadataDto,
  UpdatePlayerCardMetadataDto,
} from './dto/create-player-card-metadata.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

@Controller('player-cards')
@UseInterceptors(HttpCacheInterceptor)
export class PlayerCardMetadataController {
  constructor(private readonly playerCardMetadataService: PlayerCardMetadataService) {}

  /**
   * Get all player card metadata (public, read-only)
   * GET /player-cards
   */
  @Get()
  @CacheKey('player-cards')
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedPlayerCardMetadata> {
    return this.playerCardMetadataService.findAll(page, limit, true);
  }

  /**
   * Get player card metadata by rarity (public, read-only)
   * GET /player-cards/rarity/:rarity
   */
  @Get('rarity/:rarity')
  @CacheKey('player-cards-rarity')
  async findByRarity(
    @Param('rarity') rarity: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedPlayerCardMetadata> {
    return this.playerCardMetadataService.findByRarity(rarity, page, limit, true);
  }

  /**
   * Get player card metadata by player ID (public, read-only)
   * GET /player-cards/player/:playerId
   */
  @Get('player/:playerId')
  @CacheKey('player-cards-player')
  async findByPlayerId(
    @Param('playerId') playerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedPlayerCardMetadata> {
    return this.playerCardMetadataService.findByPlayerId(playerId, page, limit, true);
  }

  /**
   * Get player card metadata by contract address and token ID (public, read-only)
   * GET /player-cards/token/:contractAddress/:tokenId
   */
  @Get('token/:contractAddress/:tokenId')
  @CacheKey('player-cards-token')
  async findByTokenId(
    @Param('contractAddress') contractAddress: string,
    @Param('tokenId') tokenId: string,
  ): Promise<PlayerCardMetadata> {
    return this.playerCardMetadataService.findByTokenId(contractAddress, tokenId, true);
  }

  /**
   * Get a single player card metadata by ID (public, read-only)
   * GET /player-cards/:id
   */
  @Get(':id')
  @CacheKey('player-cards-single')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlayerCardMetadata> {
    return this.playerCardMetadataService.findOne(id, true);
  }

  /**
   * Create a new player card metadata (admin-only)
   * POST /player-cards
   */
  @Post()
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createPlayerCardMetadataDto: CreatePlayerCardMetadataDto,
  ): Promise<PlayerCardMetadata> {
    return this.playerCardMetadataService.create(createPlayerCardMetadataDto);
  }

  /**
   * Update player card metadata (admin-only)
   * PATCH /player-cards/:id
   */
  @Patch(':id')
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePlayerCardMetadataDto: UpdatePlayerCardMetadataDto,
  ): Promise<PlayerCardMetadata> {
    return this.playerCardMetadataService.update(id, updatePlayerCardMetadataDto);
  }

  /**
   * Delete player card metadata (admin-only)
   * DELETE /player-cards/:id
   */
  @Delete(':id')
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.playerCardMetadataService.remove(id);
  }
}
