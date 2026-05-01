import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveryNotesService } from './delivery-notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryStatus } from '@prisma/client';


const prismaMock = {
  delivery_notes: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  quotes: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  invoices: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  mouvements: {
    create: jest.fn(),
  },
  warehouse_products: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  inventaires: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BUSINESS_ID = 1;
const DELIVERY_ID = 10;
const QUOTE_ID = 5;

const makeDelivery = (overrides = {}) => ({
  id: DELIVERY_ID,
  delivery_number: 'BL-001',
  delivery_date: new Date('2024-01-15'),
  status: DeliveryStatus.PENDING,
  quote_id: QUOTE_ID,
  quotes: {
    id: QUOTE_ID,
    clients: { id: 1, business_id: BUSINESS_ID },
    invoices: [],
    quote_details: [],
  },
  ...overrides,
});

const makeQuoteDetail = (productId = 1, quantity = 3) => ({
  id: 1,
  product_id: productId,
  quantity,
  products: { id: productId, name: 'Widget' },
});

const makeWarehouseProduct = (id = 1, qty = 50) => ({
  id,
  product_id: 1,
  quantity: qty,
});

const makeInventaire = (id = 1, qtyAvailable = 100) => ({
  id,
  product_id: 1,
  quantity_available: qtyAvailable,
});

const makeInvoice = (id = 1, status = 'unpaid') => ({
  id,
  status,
});



describe('DeliveryNotesService', () => {
  let service: DeliveryNotesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryNotesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DeliveryNotesService>(DeliveryNotesService);
  });

 

  describe('changeStatus', () => {
    it('throws NotFoundException when delivery does not exist', async () => {
      prismaMock.delivery_notes.findFirst.mockResolvedValue(null);

      await expect(
        service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when delivery is already DELIVERED', async () => {
      prismaMock.delivery_notes.findFirst.mockResolvedValue(
        makeDelivery({ status: DeliveryStatus.DELIVERED }),
      );

      await expect(
        service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED),
      ).rejects.toThrow(BadRequestException);
    });

    it('changes status to IN_PROGRESS without stock logic', async () => {
      const delivery = makeDelivery({
        quotes: {
          clients: { business_id: BUSINESS_ID },
          invoices: [],
          quote_details: [makeQuoteDetail()],
        },
      });

      prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
      prismaMock.delivery_notes.update.mockResolvedValue({
        ...delivery,
        status: DeliveryStatus.DELIVERED,
      });

      await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.PENDING);

      expect(prismaMock.mouvements.create).not.toHaveBeenCalled();
      expect(prismaMock.warehouse_products.update).not.toHaveBeenCalled();
      expect(prismaMock.inventaires.update).not.toHaveBeenCalled();
      expect(prismaMock.delivery_notes.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: DeliveryStatus.PENDING } }),
      );
    });

    describe('when transitioning to DELIVERED', () => {
      it('creates stock-out mouvements for each product', async () => {
        const detail = makeQuoteDetail(1, 3);
        const delivery = makeDelivery({
          quotes: {
            clients: { business_id: BUSINESS_ID },
            invoices: [],
            quote_details: [detail],
          },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.mouvements.create.mockResolvedValue({});
        prismaMock.warehouse_products.findFirst.mockResolvedValue(makeWarehouseProduct());
        prismaMock.warehouse_products.update.mockResolvedValue({});
        prismaMock.inventaires.findFirst.mockResolvedValue(makeInventaire());
        prismaMock.inventaires.update.mockResolvedValue({});
        prismaMock.delivery_notes.update.mockResolvedValue({ ...delivery, status: DeliveryStatus.DELIVERED });

        await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(prismaMock.mouvements.create).toHaveBeenCalledTimes(1);
        expect(prismaMock.mouvements.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: 'OUT',
              product_id: detail.product_id,
              quantity: detail.quantity,
            }),
          }),
        );
      });

      it('decrements warehouse_products quantity', async () => {
        const detail = makeQuoteDetail(1, 5);
        const warehouseProduct = makeWarehouseProduct(99, 20);
        const delivery = makeDelivery({
          quotes: { clients: { business_id: BUSINESS_ID }, invoices: [], quote_details: [detail] },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.mouvements.create.mockResolvedValue({});
        prismaMock.warehouse_products.findFirst.mockResolvedValue(warehouseProduct);
        prismaMock.warehouse_products.update.mockResolvedValue({});
        prismaMock.inventaires.findFirst.mockResolvedValue(makeInventaire());
        prismaMock.inventaires.update.mockResolvedValue({});
        prismaMock.delivery_notes.update.mockResolvedValue({});

        await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(prismaMock.warehouse_products.update).toHaveBeenCalledWith({
          where: { id: warehouseProduct.id },
          data: { quantity: { decrement: detail.quantity } },
        });
      });

      it('decrements inventaires.quantity_available', async () => {
        const detail = makeQuoteDetail(1, 4);
        const inventaire = makeInventaire(7, 30);
        const delivery = makeDelivery({
          quotes: { clients: { business_id: BUSINESS_ID }, invoices: [], quote_details: [detail] },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.mouvements.create.mockResolvedValue({});
        prismaMock.warehouse_products.findFirst.mockResolvedValue(null);
        prismaMock.inventaires.findFirst.mockResolvedValue(inventaire);
        prismaMock.inventaires.update.mockResolvedValue({});
        prismaMock.delivery_notes.update.mockResolvedValue({});

        await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(prismaMock.inventaires.update).toHaveBeenCalledWith({
          where: { id: inventaire.id },
          data: { quantity_available: { decrement: detail.quantity }, last_updated: expect.any(Date) },
        });
      });

      it('skips warehouse/inventaire update when no warehouse_products row found', async () => {
        const detail = makeQuoteDetail(1, 2);
        const delivery = makeDelivery({
          quotes: { clients: { business_id: BUSINESS_ID }, invoices: [], quote_details: [detail] },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.mouvements.create.mockResolvedValue({});
        prismaMock.warehouse_products.findFirst.mockResolvedValue(null);
        prismaMock.inventaires.findFirst.mockResolvedValue(null);
        prismaMock.delivery_notes.update.mockResolvedValue({});

        await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(prismaMock.warehouse_products.update).not.toHaveBeenCalled();
        expect(prismaMock.inventaires.update).not.toHaveBeenCalled();
      });

      it('skips details with quantity <= 0', async () => {
        const detail = makeQuoteDetail(1, 0); // zero quantity
        const delivery = makeDelivery({
          quotes: { clients: { business_id: BUSINESS_ID }, invoices: [], quote_details: [detail] },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.delivery_notes.update.mockResolvedValue({});

        await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(prismaMock.mouvements.create).not.toHaveBeenCalled();
      });

      it('skips details with null product_id', async () => {
        const detail = { id: 1, product_id: null, quantity: 5, products: null };
        const delivery = makeDelivery({
          quotes: { clients: { business_id: BUSINESS_ID }, invoices: [], quote_details: [detail] },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.delivery_notes.update.mockResolvedValue({});

        await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(prismaMock.mouvements.create).not.toHaveBeenCalled();
      });

      it('handles multiple quote_details and creates mouvements for each', async () => {
        const details = [makeQuoteDetail(1, 3), { ...makeQuoteDetail(2, 7), id: 2 }];
        const delivery = makeDelivery({
          quotes: { clients: { business_id: BUSINESS_ID }, invoices: [], quote_details: details },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.mouvements.create.mockResolvedValue({});
        prismaMock.warehouse_products.findFirst.mockResolvedValue(null);
        prismaMock.inventaires.findFirst.mockResolvedValue(null);
        prismaMock.delivery_notes.update.mockResolvedValue({});

        await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(prismaMock.mouvements.create).toHaveBeenCalledTimes(2);
      });

      it('marks linked unpaid invoice as paid', async () => {
        const invoice = makeInvoice(42, 'unpaid');
        const detail = makeQuoteDetail(1, 2);
        const delivery = makeDelivery({
          quotes: {
            clients: { business_id: BUSINESS_ID },
            invoices: [invoice],
            quote_details: [detail],
          },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.mouvements.create.mockResolvedValue({});
        prismaMock.warehouse_products.findFirst.mockResolvedValue(null);
        prismaMock.inventaires.findFirst.mockResolvedValue(null);
        prismaMock.invoices.update.mockResolvedValue({});
        prismaMock.delivery_notes.update.mockResolvedValue({});

        await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(prismaMock.invoices.update).toHaveBeenCalledWith({
          where: { id: invoice.id },
          data: { status: 'paid' },
        });
      });

      it('does NOT update invoice when it is already paid', async () => {
        const invoice = makeInvoice(42, 'paid');
        const detail = makeQuoteDetail(1, 2);
        const delivery = makeDelivery({
          quotes: {
            clients: { business_id: BUSINESS_ID },
            invoices: [invoice],
            quote_details: [detail],
          },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.mouvements.create.mockResolvedValue({});
        prismaMock.warehouse_products.findFirst.mockResolvedValue(null);
        prismaMock.inventaires.findFirst.mockResolvedValue(null);
        prismaMock.delivery_notes.update.mockResolvedValue({});

        await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(prismaMock.invoices.update).not.toHaveBeenCalled();
      });

      it('does NOT update invoice when no invoice exists', async () => {
        const detail = makeQuoteDetail(1, 2);
        const delivery = makeDelivery({
          quotes: { clients: { business_id: BUSINESS_ID }, invoices: [], quote_details: [detail] },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.mouvements.create.mockResolvedValue({});
        prismaMock.warehouse_products.findFirst.mockResolvedValue(null);
        prismaMock.inventaires.findFirst.mockResolvedValue(null);
        prismaMock.delivery_notes.update.mockResolvedValue({});

        await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(prismaMock.invoices.update).not.toHaveBeenCalled();
      });

      it('returns the updated delivery note', async () => {
        const updatedDelivery = makeDelivery({ status: DeliveryStatus.DELIVERED });
        const delivery = makeDelivery({
          quotes: { clients: { business_id: BUSINESS_ID }, invoices: [], quote_details: [] },
        });

        prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);
        prismaMock.delivery_notes.update.mockResolvedValue(updatedDelivery);

        const result = await service.changeStatus(BUSINESS_ID, DELIVERY_ID, DeliveryStatus.DELIVERED);

        expect(result).toEqual(updatedDelivery);
      });
    });
  });

 
  describe('getAll', () => {
    it('returns all delivery notes for the business', async () => {
      const deliveries = [makeDelivery(), makeDelivery({ id: 11, delivery_number: 'BL-002' })];
      prismaMock.delivery_notes.findMany.mockResolvedValue(deliveries);

      const result = await service.getAll(BUSINESS_ID);

      expect(result).toEqual(deliveries);
      expect(prismaMock.delivery_notes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { quotes: { clients: { business_id: BUSINESS_ID } } },
        }),
      );
    });

    it('returns an empty array when no delivery notes exist', async () => {
      prismaMock.delivery_notes.findMany.mockResolvedValue([]);

      const result = await service.getAll(BUSINESS_ID);

      expect(result).toEqual([]);
    });
  });


  describe('getOne', () => {
    it('returns the delivery note when found', async () => {
      const delivery = makeDelivery();
      prismaMock.delivery_notes.findFirst.mockResolvedValue(delivery);

      const result = await service.getOne(BUSINESS_ID, DELIVERY_ID);

      expect(result).toEqual(delivery);
      expect(prismaMock.delivery_notes.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: DELIVERY_ID, quotes: { clients: { business_id: BUSINESS_ID } } },
        }),
      );
    });

    it('throws NotFoundException when not found', async () => {
      prismaMock.delivery_notes.findFirst.mockResolvedValue(null);

      await expect(service.getOne(BUSINESS_ID, DELIVERY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  

  describe('getQuotesNotInvoiced', () => {
    it('returns draft quotes with no linked invoice', async () => {
      const quotes = [{ id: 1 }, { id: 2 }];
      prismaMock.quotes.findMany.mockResolvedValue(quotes);

      const result = await service.getQuotesNotInvoiced(BUSINESS_ID);

      expect(result).toEqual(quotes);
      expect(prismaMock.quotes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clients: { business_id: BUSINESS_ID },
            status: 'draft',
            invoices: { none: {} },
          }),
        }),
      );
    });
  });

 
  describe('getInvoicesWithoutDeliveryNote', () => {
    it('returns invoices whose quotes have no delivery note', async () => {
      const invoices = [{ id: 1 }, { id: 2 }];
      prismaMock.invoices.findMany.mockResolvedValue(invoices);

      const result = await service.getInvoicesWithoutDeliveryNote(BUSINESS_ID);

      expect(result).toEqual(invoices);
      expect(prismaMock.invoices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            quotes: {
              clients: { business_id: BUSINESS_ID },
              delivery_notes: { none: {} },
            },
          },
        }),
      );
    });
  });

 

  describe('create', () => {
    const dto = {
      quote_id: QUOTE_ID,
      delivery_number: 'BL-001',
      delivery_date: '2024-01-15',
    };

    it('creates and returns a new delivery note', async () => {
      const quote = { id: QUOTE_ID, delivery_notes: [] };
      const created = makeDelivery();

      prismaMock.quotes.findFirst.mockResolvedValue(quote);
      prismaMock.delivery_notes.create.mockResolvedValue(created);

      const result = await service.create(BUSINESS_ID, dto);

      expect(result).toEqual(created);
      expect(prismaMock.delivery_notes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            delivery_number: dto.delivery_number,
            quote_id: dto.quote_id,
            delivery_date: new Date(dto.delivery_date),
          }),
        }),
      );
    });

    it('throws NotFoundException when quote does not belong to business', async () => {
      prismaMock.quotes.findFirst.mockResolvedValue(null);

      await expect(service.create(BUSINESS_ID, dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when a delivery note already exists for the quote', async () => {
      const quote = {
        id: QUOTE_ID,
        delivery_notes: [makeDelivery()],
      };
      prismaMock.quotes.findFirst.mockResolvedValue(quote);

      await expect(service.create(BUSINESS_ID, dto)).rejects.toThrow(BadRequestException);
    });
  });

  

  describe('update', () => {
    it('updates and returns the delivery note', async () => {
      const existing = makeDelivery();
      const updated = makeDelivery({ delivery_number: 'BL-002' });
      const dto = { delivery_number: 'BL-002', delivery_date: '2024-06-01' };

      prismaMock.delivery_notes.findFirst.mockResolvedValue(existing);
      prismaMock.delivery_notes.update.mockResolvedValue(updated);

      const result = await service.update(BUSINESS_ID, DELIVERY_ID, dto);

      expect(result).toEqual(updated);
      expect(prismaMock.delivery_notes.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: DELIVERY_ID },
          data: expect.objectContaining({
            delivery_number: 'BL-002',
            delivery_date: new Date('2024-06-01'),
          }),
        }),
      );
    });

    it('propagates NotFoundException from getOne when delivery not found', async () => {
      prismaMock.delivery_notes.findFirst.mockResolvedValue(null);

      await expect(service.update(BUSINESS_ID, DELIVERY_ID, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates only provided fields (partial update)', async () => {
      const existing = makeDelivery();
      prismaMock.delivery_notes.findFirst.mockResolvedValue(existing);
      prismaMock.delivery_notes.update.mockResolvedValue(existing);

      await service.update(BUSINESS_ID, DELIVERY_ID, { delivery_number: 'BL-NEW' });

      const callData = prismaMock.delivery_notes.update.mock.calls[0][0].data;
      expect(callData).toHaveProperty('delivery_number', 'BL-NEW');
      expect(callData).not.toHaveProperty('delivery_date');
    });
  });

  
  describe('delete', () => {
    it('deletes and returns a success message', async () => {
      prismaMock.delivery_notes.findFirst.mockResolvedValue(makeDelivery());
      prismaMock.delivery_notes.delete.mockResolvedValue({});

      const result = await service.delete(BUSINESS_ID, DELIVERY_ID);

      expect(prismaMock.delivery_notes.delete).toHaveBeenCalledWith({
        where: { id: DELIVERY_ID },
      });
      expect(result).toEqual({ message: `Delivery note #${DELIVERY_ID} deleted` });
    });

    it('propagates NotFoundException from getOne when delivery not found', async () => {
      prismaMock.delivery_notes.findFirst.mockResolvedValue(null);

      await expect(service.delete(BUSINESS_ID, DELIVERY_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});