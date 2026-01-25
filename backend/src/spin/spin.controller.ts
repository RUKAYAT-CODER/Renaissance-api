import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpinService } from './spin.service';
import { CreateSpinDto } from './dto/create-spin.dto';
import { SpinResultDto } from './dto/spin-result.dto';

/**
 * Controller for secure spin operations
 *
 * API Endpoints:
 * - POST /spin - Execute a secure spin
 * - GET /spin/history - Get user's spin history
 * - GET /spin/stats - Get spin statistics (admin)
 *
 * Security:
 * - All endpoints require JWT authentication
 * - Server-side randomness with no client influence
 * - Idempotent operations prevent replay attacks
 * - Rate limiting applied via global throttle guard
 */
@Controller('spin')
@UseGuards(JwtAuthGuard)
export class SpinController {
  constructor(private readonly spinService: SpinService) {}

  /**
   * Execute a spin with secure server-side randomness
   *
   * Request Body:
   * - stakeAmount: Amount to stake (0.01 to 1000)
   * - clientSeed: Optional client-provided seed for additional entropy
   *
   * Response:
   * - id: Unique spin identifier
   * - outcome: Spin result (jackpot, high_win, etc.)
   * - payoutAmount: Amount won (0 if no win)
   * - stakeAmount: Amount staked
   * - netResult: Net gain/loss (payout - stake)
   * - timestamp: When spin occurred
   *
   * Security Notes:
   * - Randomness is server-generated using crypto.randomBytes()
   * - Session-based idempotency prevents duplicate executions
   * - All wallet operations are atomic with rollback on failure
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async executeSpin(
    @Request() req: any,
    @Body() createSpinDto: CreateSpinDto,
  ): Promise<SpinResultDto> {
    const userId = req.user.id;
    return this.spinService.executeSpin(userId, createSpinDto);
  }

  /**
   * Get user's spin history for transparency and audit
   *
   * Returns recent spins ordered by creation date (newest first).
   * Limited to 50 most recent spins for performance.
   * Includes sanitized data without sensitive internal metadata.
   */
  @Get('history')
  async getSpinHistory(@Request() req: any): Promise<any[]> {
    const userId = req.user.id;
    const spins = await this.spinService.getUserSpinHistory(userId);

    // Return sanitized history (exclude sensitive metadata)
    return spins.map(spin => ({
      id: spin.id,
      stakeAmount: spin.stakeAmount,
      outcome: spin.outcome,
      payoutAmount: spin.payoutAmount,
      createdAt: spin.createdAt,
      netResult: Number(spin.payoutAmount) - Number(spin.stakeAmount),
    }));
  }

  /**
   * Get spin statistics (admin endpoint - would need admin guard in production)
   *
   * Returns aggregate statistics including:
   * - Total spins executed
   * - Total amount staked
   * - Total amount paid out
   * - Distribution of outcomes
   *
   * Used for monitoring fairness and business metrics.
   */
  @Get('stats')
  async getSpinStatistics(): Promise<any> {
    return this.spinService.getSpinStatistics();
  }
}