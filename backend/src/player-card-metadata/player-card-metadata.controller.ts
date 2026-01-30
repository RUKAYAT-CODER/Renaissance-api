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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { HttpCacheInterceptor } from '../common/cache/interceptors/http-cache.interceptor';
import { CacheKey } from '../common/cache/decorators/cache-key.decorator';
import { NoCache } from '../common/cache/decorators/no-cache.decorator';
import { Request } from 'express';
import {
  PlayerCardMetadataService,
  PaginatedPlayerCardMetadata,
} from './player-card-metadata.service';
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

@ApiTags('Player Cards')
@Controller('player-cards')
@UseInterceptors(HttpCacheInterceptor)
export class PlayerCardMetadataController {
  constructor(
    private readonly playerCardMetadataService: PlayerCardMetadataService,
  ) {}

  @Get()
  @CacheKey('player-cards')
  @ApiOperation({
    summary: 'Get all player cards (paginated)',
    description:
      'Retrieves a paginated list of all published player card metadata. Public endpoint, no authentication required.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of player cards retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            playerId: 'player-001',
            playerName: 'LeBron James',
            position: 'Forward',
            team: 'Los Angeles Lakers',
            rarity: 'LEGENDARY',
            imageUrl: 'https://example.com/images/lebron.png',
          },
        ],
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
      },
    },
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedPlayerCardMetadata> {
    return this.playerCardMetadataService.findAll(page, limit, true);
  }

  @Get('rarity/:rarity')
  @CacheKey('player-cards-rarity')
  @ApiOperation({
    summary: 'Get player cards by rarity',
    description:
      'Retrieves a paginated list of player cards filtered by rarity level',
  })
  @ApiParam({
    name: 'rarity',
    description: 'Card rarity level',
    example: 'LEGENDARY',
    enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Player cards filtered by rarity',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            playerName: 'LeBron James',
            rarity: 'LEGENDARY',
          },
        ],
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      },
    },
  })
  async findByRarity(
    @Param('rarity') rarity: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedPlayerCardMetadata> {
    return this.playerCardMetadataService.findByRarity(
      rarity,
      page,
      limit,
      true,
    );
  }

  @Get('player/:playerId')
  @CacheKey('player-cards-player')
  @ApiOperation({
    summary: 'Get player cards by player ID',
    description: 'Retrieves all cards for a specific player',
  })
  @ApiParam({
    name: 'playerId',
    description: 'Unique player identifier',
    example: 'player-001',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Player cards for the specified player',
  })
  async findByPlayerId(
    @Param('playerId') playerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedPlayerCardMetadata> {
    return this.playerCardMetadataService.findByPlayerId(
      playerId,
      page,
      limit,
      true,
    );
  }

  @Get('token/:contractAddress/:tokenId')
  @CacheKey('player-cards-token')
  @ApiOperation({
    summary: 'Get player card by contract and token ID',
    description:
      'Retrieves a specific player card using blockchain contract address and token ID',
  })
  @ApiParam({
    name: 'contractAddress',
    description: 'Smart contract address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  })
  @ApiParam({
    name: 'tokenId',
    description: 'Token ID on the blockchain',
    example: 'token-12345',
  })
  @ApiResponse({
    status: 200,
    description: 'Player card found',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        tokenId: 'token-12345',
        playerName: 'LeBron James',
        rarity: 'LEGENDARY',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Player card not found',
  })
  async findByTokenId(
    @Param('contractAddress') contractAddress: string,
    @Param('tokenId') tokenId: string,
  ): Promise<PlayerCardMetadata> {
    return this.playerCardMetadataService.findByTokenId(
      contractAddress,
      tokenId,
      true,
    );
  }

  @Get(':id')
  @CacheKey('player-cards-single')
  @ApiOperation({
    summary: 'Get a single player card by ID',
    description: 'Retrieves detailed information about a specific player card',
  })
  @ApiParam({
    name: 'id',
    description: 'Player card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Player card found',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        playerId: 'player-001',
        playerName: 'LeBron James',
        position: 'Forward',
        team: 'Los Angeles Lakers',
        rarity: 'LEGENDARY',
        imageUrl: 'https://example.com/images/lebron.png',
        attributes: { strength: 95, speed: 88, accuracy: 92 },
        season: '2023-2024',
        editionNumber: 42,
        totalSupply: 100,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID format',
  })
  @ApiResponse({
    status: 404,
    description: 'Player card not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlayerCardMetadata> {
    return this.playerCardMetadataService.findOne(id, true);
  }

  @Post()
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new player card (Admin only)',
    description:
      'Creates a new player card metadata entry. Requires admin authentication.',
  })
  @ApiBody({ type: CreatePlayerCardMetadataDto })
  @ApiResponse({
    status: 201,
    description: 'Player card successfully created',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        playerId: 'player-001',
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        tokenId: 'token-12345',
        playerName: 'LeBron James',
        rarity: 'LEGENDARY',
        createdAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires admin role',
  })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createPlayerCardMetadataDto: CreatePlayerCardMetadataDto,
  ): Promise<PlayerCardMetadata> {
    return this.playerCardMetadataService.create(createPlayerCardMetadataDto);
  }

  @Patch(':id')
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update player card metadata (Admin only)',
    description:
      'Updates an existing player card. Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Player card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdatePlayerCardMetadataDto })
  @ApiResponse({
    status: 200,
    description: 'Player card successfully updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID format or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Player card not found',
  })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePlayerCardMetadataDto: UpdatePlayerCardMetadataDto,
  ): Promise<PlayerCardMetadata> {
    return this.playerCardMetadataService.update(
      id,
      updatePlayerCardMetadataDto,
    );
  }

  @Delete(':id')
  @NoCache()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete player card (Admin only)',
    description:
      'Permanently deletes a player card metadata entry. Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Player card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Player card successfully deleted',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Player card not found',
  })
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.playerCardMetadataService.remove(id);
  }
}
