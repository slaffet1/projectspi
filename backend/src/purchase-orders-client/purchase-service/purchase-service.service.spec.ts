import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseServiceService } from './purchase-service.service';

describe('PurchaseServiceService', () => {
  let service: PurchaseServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseServiceService],
    }).compile();

    service = module.get<PurchaseServiceService>(PurchaseServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
