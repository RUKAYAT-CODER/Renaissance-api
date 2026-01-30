import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsObject,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CardRarity } from '../entities/player-card-metadata.entity';

export class CreatePlayerCardMetadataDto {
  @ApiProperty({
    description: 'Unique identifier for the player',
    example: 'player-001',
  })
  @IsString()
  @MinLength(1)
  playerId: string;

  @ApiProperty({
    description: 'Smart contract address for the NFT',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  })
  @IsString()
  @MinLength(1)
  contractAddress: string;

  @ApiProperty({
    description: 'Token ID on the blockchain',
    example: 'token-12345',
  })
  @IsString()
  @MinLength(1)
  tokenId: string;

  @ApiProperty({
    description: 'URI pointing to the token metadata',
    example: 'ipfs://QmXYZ123.../metadata.json',
  })
  @IsString()
  @MinLength(1)
  tokenUri: string;

  @ApiProperty({
    description: 'Name of the player',
    example: 'LeBron James',
  })
  @IsString()
  @MinLength(1)
  playerName: string;

  @ApiPropertyOptional({
    description: 'Player position',
    example: 'Forward',
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({
    description: 'Player team',
    example: 'Los Angeles Lakers',
  })
  @IsOptional()
  @IsString()
  team?: string;

  @ApiPropertyOptional({
    description: 'Rarity level of the card',
    enum: CardRarity,
    example: CardRarity.LEGENDARY,
  })
  @IsOptional()
  @IsEnum(CardRarity)
  rarity?: CardRarity;

  @ApiPropertyOptional({
    description: 'URL to the card image',
    example: 'https://example.com/images/lebron-james-card.png',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Season identifier',
    example: '2023-2024',
  })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional({
    description: 'Edition number for limited editions',
    example: 42,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  editionNumber?: number;

  @ApiPropertyOptional({
    description: 'Total supply of this card',
    example: 100,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  totalSupply?: number;

  @ApiPropertyOptional({
    description: 'Additional attributes for the card (stats, traits, etc.)',
    example: { strength: 95, speed: 88, accuracy: 92 },
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string | number>;

  @ApiPropertyOptional({
    description: 'Detailed description of the card',
    example: 'Legendary edition featuring LeBron James at peak performance',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'External URL for more information',
    example: 'https://renaissance.io/cards/lebron-james-001',
  })
  @IsOptional()
  @IsString()
  externalUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the card is published and visible',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata in JSON format',
    example: '{"special": "championship edition"}',
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}

export class UpdatePlayerCardMetadataDto {
  @ApiPropertyOptional({
    description: 'Name of the player',
    example: 'LeBron James',
  })
  @IsOptional()
  @IsString()
  playerName?: string;

  @ApiPropertyOptional({
    description: 'Player position',
    example: 'Forward',
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({
    description: 'Player team',
    example: 'Los Angeles Lakers',
  })
  @IsOptional()
  @IsString()
  team?: string;

  @ApiPropertyOptional({
    description: 'Rarity level of the card',
    enum: CardRarity,
    example: CardRarity.LEGENDARY,
  })
  @IsOptional()
  @IsEnum(CardRarity)
  rarity?: CardRarity;

  @ApiPropertyOptional({
    description: 'URL to the card image',
    example: 'https://example.com/images/lebron-james-card.png',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Season identifier',
    example: '2023-2024',
  })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional({
    description: 'Edition number for limited editions',
    example: 42,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  editionNumber?: number;

  @ApiPropertyOptional({
    description: 'Total supply of this card',
    example: 100,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  totalSupply?: number;

  @ApiPropertyOptional({
    description: 'Additional attributes for the card (stats, traits, etc.)',
    example: { strength: 95, speed: 88, accuracy: 92 },
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string | number>;

  @ApiPropertyOptional({
    description: 'Detailed description of the card',
    example: 'Legendary edition featuring LeBron James at peak performance',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'External URL for more information',
    example: 'https://renaissance.io/cards/lebron-james-001',
  })
  @IsOptional()
  @IsString()
  externalUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the card is published and visible',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata in JSON format',
    example: '{"special": "championship edition"}',
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}
