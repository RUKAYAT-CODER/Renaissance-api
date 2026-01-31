import { Test, TestingModule } from '@nestjs/testing';
import { SpinGameController } from './spin-game.controller';
import { SpinGameService } from './spin-game.service';

describe('SpinGameController', () => {
  let controller: SpinGameController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpinGameController],
      providers: [
        {
          provide: SpinGameService,
          useValue: {
            checkEligibility: jest.fn(),
            executeSpin: jest.fn(),
            getUserStatistics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SpinGameController>(SpinGameController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
