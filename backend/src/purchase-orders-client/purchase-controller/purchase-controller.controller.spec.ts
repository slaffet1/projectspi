import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseControllerController } from './purchase-controller.controller';

describe('PurchaseControllerController', () => {
  let controller: PurchaseControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseControllerController],
    }).compile();

    controller = module.get<PurchaseControllerController>(PurchaseControllerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
