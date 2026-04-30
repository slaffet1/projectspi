import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  clients: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a client', async () => {
    mockPrisma.clients.create.mockResolvedValue({ id: 1, name: 'Mariem' });

    const result = await service.create({ name: 'Mariem' } as any, 1);

    expect(prisma.clients.create).toHaveBeenCalled();
    expect(result.name).toBe('Mariem');
  });

  it('should return all clients', async () => {
    mockPrisma.clients.findMany.mockResolvedValue([{ id: 1 }]);

    const result = await service.findAll(1);

    expect(result).toHaveLength(1);
  });

  it('should search clients', async () => {
    mockPrisma.clients.findMany.mockResolvedValue([{ name: 'Mariem' }]);

    const result = await service.search('mar', 1);

    expect(prisma.clients.findMany).toHaveBeenCalled();
    expect(result[0].name).toBe('Mariem');
  });

  it('should update client', async () => {
    mockPrisma.clients.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.update(1, { name: 'New' }, 1);

    expect(result.count).toBe(1);
  });

  it('should delete client', async () => {
    mockPrisma.clients.deleteMany.mockResolvedValue({ count: 1 });

    const result = await service.remove(1, 1);

    expect(result.count).toBe(1);
  });
});