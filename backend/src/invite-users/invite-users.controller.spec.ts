// Mock uuid pour éviter l'erreur ESModule
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { InviteUsersController } from './invite-users.controller';
import { InviteUsersService } from './invite-users.service';

const mockInviteUsersService = {
  inviteUser: jest.fn(),
  getBusinessMembers: jest.fn(),
  getPendingInvitations: jest.fn(),
  removeMember: jest.fn(),
  cancelInvitation: jest.fn(),
  acceptInvitation: jest.fn(),
};

describe('InviteUsersController', () => {
  let controller: InviteUsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InviteUsersController],
      providers: [
        { provide: InviteUsersService, useValue: mockInviteUsersService },
      ],
    }).compile();

    controller = module.get<InviteUsersController>(InviteUsersController);
    jest.clearAllMocks();
  });

  // ── inviteUser ──────────────────────────────────────────────────
  describe('inviteUser', () => {
    it('should call service.inviteUser with converted id, email and role_id', async () => {
      const body = { email: 'user@example.com', role_id: 2 };
      const expected = { id: 1, email: body.email, role_id: body.role_id, status: 'pending' };

      mockInviteUsersService.inviteUser.mockResolvedValue(expected);

      const result = await controller.inviteUser('1', body);

      expect(mockInviteUsersService.inviteUser).toHaveBeenCalledWith(1, body.email, body.role_id);
      expect(result).toEqual(expected);
    });

    it('should convert id string to number', async () => {
      mockInviteUsersService.inviteUser.mockResolvedValue({});

      await controller.inviteUser('42', { email: 'test@test.com', role_id: 1 });

      expect(mockInviteUsersService.inviteUser).toHaveBeenCalledWith(42, 'test@test.com', 1);
    });

    it('should propagate errors thrown by the service', async () => {
      mockInviteUsersService.inviteUser.mockRejectedValue(new Error('User already invited'));

      await expect(
        controller.inviteUser('1', { email: 'exists@test.com', role_id: 1 }),
      ).rejects.toThrow('User already invited');
    });
  });

  // ── getBusinessMembers ──────────────────────────────────────────
  describe('getBusinessMembers', () => {
    it('should call service.getBusinessMembers with converted id', async () => {
      const members = [
        { id: 1, user_id: 10, business_id: 1, role: 'OWNER' },
        { id: 2, user_id: 11, business_id: 1, role: 'MEMBER' },
      ];

      mockInviteUsersService.getBusinessMembers.mockResolvedValue(members);

      const result = await controller.getBusinessMembers('1');

      expect(mockInviteUsersService.getBusinessMembers).toHaveBeenCalledWith(1);
      expect(result).toEqual(members);
    });

    it('should convert id string to number', async () => {
      mockInviteUsersService.getBusinessMembers.mockResolvedValue([]);

      await controller.getBusinessMembers('42');

      expect(mockInviteUsersService.getBusinessMembers).toHaveBeenCalledWith(42);
    });

    it('should return empty array when no members exist', async () => {
      mockInviteUsersService.getBusinessMembers.mockResolvedValue([]);

      const result = await controller.getBusinessMembers('99');

      expect(result).toEqual([]);
    });

    it('should propagate errors thrown by the service', async () => {
      mockInviteUsersService.getBusinessMembers.mockRejectedValue(
        new Error('Business not found'),
      );

      await expect(
        controller.getBusinessMembers('999'),
      ).rejects.toThrow('Business not found');
    });
  });

  // ── getPendingInvitations ───────────────────────────────────────
  describe('getPendingInvitations', () => {
    it('should call service.getPendingInvitations with converted id', async () => {
      const invitations = [
        { id: 1, email: 'pending@test.com', business_id: 1, status: 'pending' },
        { id: 2, email: 'waiting@test.com', business_id: 1, status: 'pending' },
      ];

      mockInviteUsersService.getPendingInvitations.mockResolvedValue(invitations);

      const result = await controller.getPendingInvitations('1');

      expect(mockInviteUsersService.getPendingInvitations).toHaveBeenCalledWith(1);
      expect(result).toEqual(invitations);
    });

    it('should convert id string to number', async () => {
      mockInviteUsersService.getPendingInvitations.mockResolvedValue([]);

      await controller.getPendingInvitations('42');

      expect(mockInviteUsersService.getPendingInvitations).toHaveBeenCalledWith(42);
    });

    it('should return empty array when no pending invitations', async () => {
      mockInviteUsersService.getPendingInvitations.mockResolvedValue([]);

      const result = await controller.getPendingInvitations('1');

      expect(result).toEqual([]);
    });

    it('should propagate errors thrown by the service', async () => {
      mockInviteUsersService.getPendingInvitations.mockRejectedValue(
        new Error('Business not found'),
      );

      await expect(
        controller.getPendingInvitations('999'),
      ).rejects.toThrow('Business not found');
    });
  });

  // ── removeMember ────────────────────────────────────────────────
  describe('removeMember', () => {
    it('should call service.removeMember with converted id and userId', async () => {
      mockInviteUsersService.removeMember.mockResolvedValue({ success: true });

      const result = await controller.removeMember('1', '10');

      expect(mockInviteUsersService.removeMember).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual({ success: true });
    });

    it('should convert both id and userId strings to numbers', async () => {
      mockInviteUsersService.removeMember.mockResolvedValue({});

      await controller.removeMember('42', '99');

      expect(mockInviteUsersService.removeMember).toHaveBeenCalledWith(42, 99);
    });

    it('should propagate errors thrown by the service', async () => {
      mockInviteUsersService.removeMember.mockRejectedValue(new Error('Member not found'));

      await expect(
        controller.removeMember('1', '999'),
      ).rejects.toThrow('Member not found');
    });
  });

  // ── cancelInvitation ────────────────────────────────────────────
  describe('cancelInvitation', () => {
    it('should call service.cancelInvitation with converted invitationId', async () => {
      mockInviteUsersService.cancelInvitation.mockResolvedValue({ success: true });

      const result = await controller.cancelInvitation('5');

      expect(mockInviteUsersService.cancelInvitation).toHaveBeenCalledWith(5);
      expect(result).toEqual({ success: true });
    });

    it('should convert invitationId string to number', async () => {
      mockInviteUsersService.cancelInvitation.mockResolvedValue({});

      await controller.cancelInvitation('42');

      expect(mockInviteUsersService.cancelInvitation).toHaveBeenCalledWith(42);
    });

    it('should propagate errors thrown by the service', async () => {
      mockInviteUsersService.cancelInvitation.mockRejectedValue(
        new Error('Invitation not found'),
      );

      await expect(
        controller.cancelInvitation('999'),
      ).rejects.toThrow('Invitation not found');
    });
  });

  // ── acceptInvitation ────────────────────────────────────────────
  describe('acceptInvitation', () => {
    it('should call service.acceptInvitation with token and user_id', async () => {
      const body = { token: 'abc123token', user_id: 10 };
      const expected = { success: true, businessId: 1 };

      mockInviteUsersService.acceptInvitation.mockResolvedValue(expected);

      const result = await controller.acceptInvitation(body);

      expect(mockInviteUsersService.acceptInvitation).toHaveBeenCalledWith(
        body.token,
        body.user_id,
      );
      expect(result).toEqual(expected);
    });

    it('should propagate errors if token is invalid', async () => {
      mockInviteUsersService.acceptInvitation.mockRejectedValue(
        new Error('Invalid or expired token'),
      );

      await expect(
        controller.acceptInvitation({ token: 'invalid', user_id: 1 }),
      ).rejects.toThrow('Invalid or expired token');
    });

    it('should propagate errors if invitation is already accepted', async () => {
      mockInviteUsersService.acceptInvitation.mockRejectedValue(
        new Error('Invitation already accepted'),
      );

      await expect(
        controller.acceptInvitation({ token: 'used-token', user_id: 2 }),
      ).rejects.toThrow('Invitation already accepted');
    });
  });
});