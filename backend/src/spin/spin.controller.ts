import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpinService } from './spin.service';
import { CreateSpinDto } from './dto/create-spin.dto';
import { SpinResultDto } from './dto/spin-result.dto';
import { CriticalAction } from '../common/decorators/critical-action.decorator';
import { RateLimitInteractionGuard } from '../rate-limit/guards/rate-limit-interaction.guard';
import { RateLimitAction } from '../rate-limit/decorators/rate-limit-action.decorator';

/**
 * Controller for secure spin operations with provably fair randomness
 *
 * Security Features:
 * - Server-side cryptographic randomness (crypto.randomBytes)
 * - No client influence on outcomes
 * - Idempotent operations prevent replay attacks
 * - Rate limiting via global throttle guard
 * - Atomic wallet operations with rollback
 */
@ApiTags('Spin')
@Controller('spin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SpinController {
  constructor(private readonly spinService: SpinService) {}

  @Post()
  @CriticalAction('spin.execute')
  @UseGuards(RateLimitInteractionGuard)
  @RateLimitAction('spin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute a spin',
    description:
      'Performs a secure spin with server-side randomness. Stake is deducted and payout is credited based on the outcome. Uses cryptographic randomness for fairness.',
  })
  @ApiBody({ type: CreateSpinDto })
  @ApiResponse({
    status: 200,
    description: 'Spin executed successfully',
    type: SpinResultDto,
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        outcome: 'high_win',
        payoutAmount: 50.0,
        stakeAmount: 10.0,
        netResult: 40.0,
        timestamp: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - insufficient balance or invalid stake amount',
    schema: {
      example: {
        statusCode: 400,
        message: 'Insufficient balance to place spin',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  async executeSpin(
    @Request() req: any,
    @Body() createSpinDto: CreateSpinDto,
  ): Promise<SpinResultDto> {
    const userId = req.user.userId ?? req.user.id;
    return this.spinService.executeSpin(userId, createSpinDto);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get user spin history',
    description:
      'Retrieves the 50 most recent spins for the authenticated user. Provides transparency and audit trail.',
  })
  @ApiResponse({
    status: 200,
    description: 'Spin history retrieved successfully',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          stakeAmount: 10.0,
          outcome: 'high_win',
          payoutAmount: 50.0,
          createdAt: '2024-01-15T10:30:00Z',
          netResult: 40.0,
        },
        {
          id: '234e5678-e90b-12d3-a456-426614174001',
          stakeAmount: 5.0,
          outcome: 'loss',
          payoutAmount: 0.0,
          createdAt: '2024-01-15T09:15:00Z',
          netResult: -5.0,
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  async getSpinHistory(@Request() req: any): Promise<any[]> {
    const userId = req.user.userId ?? req.user.id;
    const spins = await this.spinService.getUserSpinHistory(userId);

    return spins.map((spin) => ({
      id: spin.id,
      stakeAmount: spin.stakeAmount,
      outcome: spin.outcome,
      payoutAmount: spin.payoutAmount,
      createdAt: spin.createdAt,
      netResult: Number(spin.payoutAmount) - Number(spin.stakeAmount),
    }));
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get spin statistics',
    description:
      'Retrieves aggregate spin statistics including total spins, total staked, total paid out, and outcome distribution. Useful for monitoring fairness and business metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Spin statistics retrieved successfully',
    schema: {
      example: {
        totalSpins: 10000,
        totalStaked: 100000.0,
        totalPaidOut: 95000.0,
        houseEdge: 5.0,
        outcomeDistribution: {
          jackpot: 10,
          high_win: 250,
          medium_win: 1000,
          low_win: 2500,
          loss: 6240,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  async getSpinStatistics(): Promise<any> {
    return this.spinService.getSpinStatistics();
  }
}
