import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermission } from 'src/permissions/permissions/permissions.guard';

const mockClientsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// Simule le decorator @CurrentBusiness() qui extrait le businessId
const BUSINESS_ID = 1;

describe('ClientsController', () => {
  let controller: ClientsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        { provide: ClientsService, useValue: mockClientsService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(RequirePermission)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClientsController>(ClientsController);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────
  describe('create', () => {
    it('should call clientsService.create with dto and businessId', async () => {
      const dto = {
        name: 'Acme Corp',
        email: 'contact@acme.com',
        phone: '12345678',
      };
      const expected = { id: 1, ...dto, business_id: BUSINESS_ID };

      mockClientsService.create.mockResolvedValue(expected);

      const result = await controller.create(BUSINESS_ID, dto as any);

      expect(mockClientsService.create).toHaveBeenCalledWith(dto, BUSINESS_ID);
      expect(result).toEqual(expected);
    });

    it('should propagate errors thrown by the service', async () => {
      mockClientsService.create.mockRejectedValue(new Error('Client already exists'));

      await expect(
        controller.create(BUSINESS_ID, { name: 'Test' } as any),
      ).rejects.toThrow('Client already exists');
    });
  });

  // ── findAll ─────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should call clientsService.findAll with businessId', async () => {
      const clients = [
        { id: 1, name: 'Acme Corp', business_id: BUSINESS_ID },
        { id: 2, name: 'Beta Ltd', business_id: BUSINESS_ID },
      ];

      mockClientsService.findAll.mockResolvedValue(clients);

      const result = await controller.findAll(BUSINESS_ID);

      expect(mockClientsService.findAll).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result).toEqual(clients);
    });

    it('should return empty array when no clients exist', async () => {
      mockClientsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(99);

      expect(result).toEqual([]);
    });
  });

  // ── search ──────────────────────────────────────────────────────
  describe('search', () => {
    it('should call clientsService.search with query and businessId', async () => {
      const clients = [{ id: 1, name: 'Acme Corp', business_id: BUSINESS_ID }];

      mockClientsService.search.mockResolvedValue(clients);

      const result = await controller.search(BUSINESS_ID, 'Acme');

      expect(mockClientsService.search).toHaveBeenCalledWith('Acme', BUSINESS_ID);
      expect(result).toEqual(clients);
    });

    it('should return empty array if no match', async () => {
      mockClientsService.search.mockResolvedValue([]);

      const result = await controller.search(BUSINESS_ID, 'xyz');

      expect(result).toEqual([]);
    });

    it('should handle empty query string', async () => {
      mockClientsService.search.mockResolvedValue([]);

      const result = await controller.search(BUSINESS_ID, '');

      expect(mockClientsService.search).toHaveBeenCalledWith('', BUSINESS_ID);
      expect(result).toEqual([]);
    });
  });

  // ── update ──────────────────────────────────────────────────────
  describe('update', () => {
    it('should call clientsService.update with id, dto and businessId', async () => {
      const dto = { name: 'Acme Updated', email: 'new@acme.com' };
      const expected = { id: 1, ...dto, business_id: BUSINESS_ID };

      mockClientsService.update.mockResolvedValue(expected);

      const result = await controller.update(BUSINESS_ID, '1', dto as any);

      // Vérifie la conversion string -> number via +id
      expect(mockClientsService.update).toHaveBeenCalledWith(1, dto, BUSINESS_ID);
      expect(result).toEqual(expected);
    });

    it('should convert id string to number', async () => {
      mockClientsService.update.mockResolvedValue({});

      await controller.update(BUSINESS_ID, '42', {} as any);

      expect(mockClientsService.update).toHaveBeenCalledWith(42, {}, BUSINESS_ID);
    });

    it('should propagate errors thrown by the service', async () => {
      mockClientsService.update.mockRejectedValue(new Error('Client not found'));

      await expect(
        controller.update(BUSINESS_ID, '999', {} as any),
      ).rejects.toThrow('Client not found');
    });
  });

  // ── remove ──────────────────────────────────────────────────────
  describe('remove', () => {
    it('should call clientsService.remove with id and businessId', async () => {
      mockClientsService.remove.mockResolvedValue({ count: 1 });

      const result = await controller.remove(BUSINESS_ID, '1');

      // Vérifie la conversion string -> number via +id
      expect(mockClientsService.remove).toHaveBeenCalledWith(1, BUSINESS_ID);
      expect(result).toEqual({ count: 1 });
    });

    it('should convert id string to number', async () => {
      mockClientsService.remove.mockResolvedValue({ count: 1 });

      await controller.remove(BUSINESS_ID, '42');

      expect(mockClientsService.remove).toHaveBeenCalledWith(42, BUSINESS_ID);
    });

    it('should return count 0 if client not found', async () => {
      mockClientsService.remove.mockResolvedValue({ count: 0 });

      const result = await controller.remove(BUSINESS_ID, '999');

      expect(result).toEqual({ count: 0 });
    });

    it('should propagate errors thrown by the service', async () => {
      mockClientsService.remove.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.remove(BUSINESS_ID, '999')).rejects.toThrow('Delete failed');
    });
  });
});