import { TokenConsumptionService } from '../token-consumption';
import { db } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    agency: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tokenTransaction: {
      create: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  },
}));

describe('TokenConsumptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkTokenBalance', () => {
    it('should return true when agency has sufficient tokens', async () => {
      const mockAgency = { tokenBalance: 1000 };
      (db.agency.findUnique as jest.Mock).mockResolvedValue(mockAgency);

      const result = await TokenConsumptionService.checkTokenBalance('agency-1', 500);

      expect(result).toBe(true);
      expect(db.agency.findUnique).toHaveBeenCalledWith({
        where: { id: 'agency-1' },
        select: { tokenBalance: true },
      });
    });

    it('should return false when agency has insufficient tokens', async () => {
      const mockAgency = { tokenBalance: 100 };
      (db.agency.findUnique as jest.Mock).mockResolvedValue(mockAgency);

      const result = await TokenConsumptionService.checkTokenBalance('agency-1', 500);

      expect(result).toBe(false);
    });

    it('should return false when agency is not found', async () => {
      (db.agency.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await TokenConsumptionService.checkTokenBalance('agency-1', 500);

      expect(result).toBe(false);
    });
  });

  describe('consumeTokens', () => {
    it('should successfully consume tokens when balance is sufficient', async () => {
      const mockAgency = { tokenBalance: 1000 };
      (db.agency.findUnique as jest.Mock).mockResolvedValue(mockAgency);
      (db.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          agency: {
            update: jest.fn(),
          },
          tokenTransaction: {
            create: jest.fn(),
          },
        });
      });

      const consumption = {
        agencyId: 'agency-1',
        userId: 'user-1',
        amount: 100,
        description: 'Test consumption',
        reference: 'job-1',
        metadata: { test: true },
      };

      await expect(TokenConsumptionService.consumeTokens(consumption)).resolves.not.toThrow();
    });

    it('should throw error when balance is insufficient', async () => {
      const mockAgency = { tokenBalance: 50 };
      (db.agency.findUnique as jest.Mock).mockResolvedValue(mockAgency);

      const consumption = {
        agencyId: 'agency-1',
        userId: 'user-1',
        amount: 100,
        description: 'Test consumption',
      };

      await expect(TokenConsumptionService.consumeTokens(consumption))
        .rejects.toThrow('Insufficient token balance');
    });
  });

  describe('getTokenCosts', () => {
    it('should return correct token costs for different operations', () => {
      const costs = TokenConsumptionService.getTokenCosts();

      expect(costs).toEqual({
        IDEA_GENERATION: 50,
        COPY_DESIGN: 75,
        COPY_PUBLICATION: 75,
        BASE_IMAGE: 150,
        FINAL_DESIGN: 200,
        CONTENT_REGENERATION: 25,
        BULK_GENERATION: 300,
        PREMIUM_TEMPLATES: 100,
        SOCIAL_PUBLISHING: 10,
        SOCIAL_ANALYTICS: 5,
      });
    });
  });

  describe('calculateJobTokens', () => {
    it('should calculate correct tokens for a complete job', () => {
      const steps = ['IDEA', 'COPY_DESIGN', 'COPY_PUBLICATION', 'BASE_IMAGE', 'FINAL_DESIGN'];
      const result = TokenConsumptionService.calculateJobTokens(steps);

      // 50 + 75 + 75 + 150 + 200 = 550
      expect(result).toBe(550);
    });

    it('should calculate correct tokens for text-only job', () => {
      const steps = ['IDEA', 'COPY_DESIGN', 'COPY_PUBLICATION'];
      const result = TokenConsumptionService.calculateJobTokens(steps);

      // 50 + 75 + 75 = 200
      expect(result).toBe(200);
    });

    it('should handle unknown steps with default cost', () => {
      const steps = ['UNKNOWN_STEP'];
      const result = TokenConsumptionService.calculateJobTokens(steps);

      expect(result).toBe(50); // Default cost
    });
  });

  describe('estimateCampaignTokens', () => {
    it('should estimate tokens for campaign with images', () => {
      const result = TokenConsumptionService.estimateCampaignTokens(10, true, 0.2);

      // 10 posts * 550 tokens per post = 5500
      // With 20% buffer: 5500 + (5500 * 0.2) = 6600
      expect(result).toBe(6600);
    });

    it('should estimate tokens for campaign without images', () => {
      const result = TokenConsumptionService.estimateCampaignTokens(5, false, 0.1);

      // 5 posts * 200 tokens per post = 1000
      // With 10% buffer: 1000 + (1000 * 0.1) = 1100
      expect(result).toBe(1100);
    });
  });

  describe('canAffordCampaign', () => {
    it('should return true when agency can afford campaign', async () => {
      const mockAgency = { tokenBalance: 10000 };
      (db.agency.findUnique as jest.Mock).mockResolvedValue(mockAgency);

      const result = await TokenConsumptionService.canAffordCampaign('agency-1', 5, true);

      expect(result.canAfford).toBe(true);
      expect(result.required).toBe(3300); // 5 posts with images and buffer
      expect(result.available).toBe(10000);
    });

    it('should return false when agency cannot afford campaign', async () => {
      const mockAgency = { tokenBalance: 1000 };
      (db.agency.findUnique as jest.Mock).mockResolvedValue(mockAgency);

      const result = await TokenConsumptionService.canAffordCampaign('agency-1', 10, true);

      expect(result.canAfford).toBe(false);
      expect(result.required).toBe(6600); // 10 posts with images and buffer
      expect(result.available).toBe(1000);
    });
  });
});