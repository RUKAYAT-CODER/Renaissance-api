import { Test, TestingModule } from '@nestjs/testing';
import { CacheInvalidationService } from './cache-invalidation.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

const mockCacheManager = {
  del: jest.fn(),
  reset: jest.fn(),
  store: {
    keys: jest.fn(),
    mdel: jest.fn(),
  },
};

describe('CacheInvalidationService', () => {
  let service: CacheInvalidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInvalidationService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheInvalidationService>(CacheInvalidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('invalidateKey', () => {
    it('should call cacheManager.del with the correct key', async () => {
      const key = 'test-key';
      await service.invalidateKey(key);
      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  describe('clearAll', () => {
    it('should call cacheManager.reset', async () => {
      await service.clearAll();
      expect(mockCacheManager.reset).toHaveBeenCalled();
    });
  });

  describe('invalidatePattern', () => {
    it('should find keys matching pattern and delete them', async () => {
      const pattern = 'test*';
      const keys = ['test-1', 'test-2'];
      mockCacheManager.store.keys.mockResolvedValue(keys);

      await service.invalidatePattern(pattern);

      expect(mockCacheManager.store.keys).toHaveBeenCalledWith(pattern);
      expect(mockCacheManager.store.mdel).toHaveBeenCalledWith(...keys);
    });

    it('should do nothing if no keys match pattern', async () => {
      const pattern = 'test*';
      mockCacheManager.store.keys.mockResolvedValue([]);

      await service.invalidatePattern(pattern);

      expect(mockCacheManager.store.keys).toHaveBeenCalledWith(pattern);
      expect(mockCacheManager.store.mdel).not.toHaveBeenCalled();
    });
  });
});
