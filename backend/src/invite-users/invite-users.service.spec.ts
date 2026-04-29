import { Test, TestingModule } from '@nestjs/testing';
import { InviteUsersService } from './invite-users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  businesses: { findUnique: jest.fn() },
  roles: { findUnique: jest.fn() },
  users: { findUnique: jest.fn() },
  business_users: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  invitations: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
};

describe('InviteUsersService', () => {
  let service: InviteUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteUsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InviteUsersService>(InviteUsersService);

    // Mock nodemailer pour ne pas envoyer de vrais emails
    jest.spyOn(service as any, 'sendNotificationEmail').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'sendInvitationEmail').mockResolvedValue(undefined);

    jest.clearAllMocks();
  });

  describe('inviteUser — existing user', () => {
    it('should add existing user to business', async () => {
      const business = { id: 1, name: 'Test Co' };
      const role = { id: 1, title: 'Manager' };
      const user = { id: 10, email: 'user@test.com', firstname: 'Ali', lastname: 'Ben' };

      mockPrisma.businesses.findUnique.mockResolvedValue(business);
      mockPrisma.roles.findUnique.mockResolvedValue(role);
      mockPrisma.users.findUnique.mockResolvedValue(user);
      mockPrisma.business_users.findUnique.mockResolvedValue(null);
      mockPrisma.business_users.create.mockResolvedValue({});
      jest.spyOn(service as any, 'sendNotificationEmail').mockResolvedValue(undefined);

      const result = await service.inviteUser(1, 'user@test.com', 1);
      expect(result.status).toBe('added');
    });

    it('should return already_member if user already in business', async () => {
      const business = { id: 1, name: 'Test Co' };
      const role = { id: 1, title: 'Manager' };
      const user = { id: 10, email: 'user@test.com' };

      mockPrisma.businesses.findUnique.mockResolvedValue(business);
      mockPrisma.roles.findUnique.mockResolvedValue(role);
      mockPrisma.users.findUnique.mockResolvedValue(user);
      mockPrisma.business_users.findUnique.mockResolvedValue({ id: 1 });

      const result = await service.inviteUser(1, 'user@test.com', 1);
      expect(result.status).toBe('already_member');
    });
  });

  describe('inviteUser — new user', () => {
    it('should create invitation for new user', async () => {
      const business = { id: 1, name: 'Test Co' };
      const role = { id: 1, title: 'Manager' };

      mockPrisma.businesses.findUnique.mockResolvedValue(business);
      mockPrisma.roles.findUnique.mockResolvedValue(role);
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.invitations.findFirst.mockResolvedValue(null);
      mockPrisma.invitations.create.mockResolvedValue({});
      jest.spyOn(service as any, 'sendInvitationEmail').mockResolvedValue(undefined);

      const result = await service.inviteUser(1, 'new@test.com', 1);
      expect(result.status).toBe('invited');
    });

    it('should return already_invited if invitation exists', async () => {
      const business = { id: 1, name: 'Test Co' };
      const role = { id: 1, title: 'Manager' };

      mockPrisma.businesses.findUnique.mockResolvedValue(business);
      mockPrisma.roles.findUnique.mockResolvedValue(role);
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.invitations.findFirst.mockResolvedValue({ id: 1, status: 'pending' });

      const result = await service.inviteUser(1, 'new@test.com', 1);
      expect(result.status).toBe('already_invited');
    });
  });

  describe('inviteUser — errors', () => {
    it('should throw NotFoundException if business not found', async () => {
      mockPrisma.businesses.findUnique.mockResolvedValue(null);

      await expect(service.inviteUser(99, 'x@test.com', 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrisma.businesses.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.roles.findUnique.mockResolvedValue(null);

      await expect(service.inviteUser(1, 'x@test.com', 99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept a valid invitation', async () => {
      const invitation = {
        id: 1, token: 'abc', status: 'pending',
        expires_at: new Date(Date.now() + 100000),
        business_id: 1, role_id: 1,
      };
      mockPrisma.invitations.findUnique.mockResolvedValue(invitation);
      mockPrisma.business_users.create.mockResolvedValue({});
      mockPrisma.invitations.update.mockResolvedValue({});

      const result = await service.acceptInvitation('abc', 10);
      expect(result.status).toBe('accepted');
    });

    it('should throw NotFoundException if invitation not found', async () => {
      mockPrisma.invitations.findUnique.mockResolvedValue(null);

      await expect(service.acceptInvitation('invalid', 1)).rejects.toThrow(NotFoundException);
    });
  });
});
