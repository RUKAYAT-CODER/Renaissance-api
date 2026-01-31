import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { SpinGameService } from './spin-game.service';
import { SpinGameRepository } from './repositories/spin-game.repository';

describe('SpinGameService', () => {
  let service: SpinGameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpinGameService,
        {
          provide: SpinGameRepository,
          useValue: {
            getUserStats: jest.fn(),
            resetDailyStatsIfNeeded: jest.fn(),
            saveSpin: jest.fn(),
            updateUserStats: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SpinGameService>(SpinGameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
