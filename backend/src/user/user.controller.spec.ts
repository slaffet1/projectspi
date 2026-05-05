
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';

const mockUserService = {
  createUser: jest.fn(),
  login: jest.fn(),
  verifyEmail: jest.fn(),
  getProfile: jest.fn(),
  changePassword: jest.fn(),
  resetPassword: jest.fn(),
  updateUser: jest.fn(),
  setup2FA: jest.fn(),
  enable2FA: jest.fn(),
  verify2FA: jest.fn(),
};

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    jest.clearAllMocks();
  });

  const USER_ID = 1;

  // ───────── REGISTER ─────────
  describe('register', () => {
    it('should create user', async () => {
      const dto = { email: 'test@mail.com', password: '1234' };

      mockUserService.createUser.mockResolvedValue(dto);

      const result = await controller.register(dto as any);

      expect(mockUserService.createUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual(dto);
    });
  });

  // ───────── LOGIN ─────────
  describe('login', () => {
    it('should login user', async () => {
      const body = { email: 'test@mail.com', password: '1234' };
      const expected = { token: 'jwt' };

      mockUserService.login.mockResolvedValue(expected);

      const result = await controller.login(body);

      expect(mockUserService.login).toHaveBeenCalledWith(
        body.email,
        body.password,
      );
      expect(result).toEqual(expected);
    });
  });

  // ───────── VERIFY EMAIL ─────────
  describe('verifyEmail', () => {
    it('should verify email token', async () => {
      mockUserService.verifyEmail.mockResolvedValue({ success: true });

      const result = await controller.verifyEmail('token123');

      expect(mockUserService.verifyEmail).toHaveBeenCalledWith('token123');
      expect(result).toEqual({ success: true });
    });
  });

  // ───────── PROFILE ─────────
  describe('profile', () => {
    it('should return profile', async () => {
      const req = { user: { id: USER_ID } };
      const expected = { id: USER_ID, email: 'test@mail.com' };

      mockUserService.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile(req as any);

      expect(mockUserService.getProfile).toHaveBeenCalledWith(USER_ID);
      expect(result).toEqual(expected);
    });
  });

  // ───────── CHANGE PASSWORD ─────────
  describe('changePassword', () => {
    it('should change password', async () => {
      const req = { user: { id: USER_ID } };
      const body = {
        oldPassword: 'old',
        newPassword: 'new',
      };

      mockUserService.changePassword.mockResolvedValue({ success: true });

      const result = await controller.changePassword(req as any, body);

      expect(mockUserService.changePassword).toHaveBeenCalledWith(
        USER_ID,
        body.oldPassword,
        body.newPassword,
      );

      expect(result).toEqual({ success: true });
    });
  });

  // ───────── RESET PASSWORD ─────────
  describe('resetPassword', () => {
    it('should reset password', async () => {
      const body = {
        email: 'test@mail.com',
        newPassword: 'new123',
      };

      mockUserService.resetPassword.mockResolvedValue({ success: true });

      const result = await controller.resetPassword(body);

      expect(mockUserService.resetPassword).toHaveBeenCalledWith(
        body.email,
        body.newPassword,
      );

      expect(result).toEqual({ success: true });
    });
  });

  // ───────── UPDATE PROFILE ─────────
  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const req = { user: { id: USER_ID } };
      const dto = { firstname: 'John' };

      const updatedUser = {
        id: USER_ID,
        email: 'test@mail.com',
        firstname: 'John',
        lastname: 'Doe',
        phone_number: '123',
      };

      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(req as any, dto as any);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        USER_ID,
        dto,
      );

      expect(result.user.id).toBe(USER_ID);
    });

    it('should throw error if user not found', async () => {
      const req = { user: {} };

      await expect(
        controller.updateProfile(req as any, {} as any),
      ).rejects.toThrow('User not found');
    });
  });

  // ───────── 2FA SETUP ─────────
  describe('setup2FA', () => {
    it('should setup 2FA', async () => {
      const req = { user: { id: USER_ID } };

      mockUserService.setup2FA.mockResolvedValue({ qr: 'code' });

      const result = await controller.setup2FA(req as any);

      expect(mockUserService.setup2FA).toHaveBeenCalledWith(USER_ID);
      expect(result).toEqual({ qr: 'code' });
    });
  });

  // ───────── ENABLE 2FA ─────────
  describe('enable2FA', () => {
    it('should enable 2FA', async () => {
      const req = { user: { id: USER_ID } };

      mockUserService.enable2FA.mockResolvedValue({ enabled: true });

      const result = await controller.enable2FA(req as any, '123456');

      expect(mockUserService.enable2FA).toHaveBeenCalledWith(
        USER_ID,
        '123456',
      );

      expect(result).toEqual({ enabled: true });
    });
  });

  // ───────── VERIFY 2FA ─────────
  describe('verify2FA', () => {
    it('should verify 2FA', async () => {
      const body = {
        userId: USER_ID,
        code: '999999',
      };

      mockUserService.verify2FA.mockResolvedValue({ valid: true });

      const result = await controller.verify2FA(body);

      expect(mockUserService.verify2FA).toHaveBeenCalledWith(
        USER_ID,
        body.code,
      );

      expect(result).toEqual({ valid: true });
    });

    it('should throw if missing params', async () => {
      await expect(
        controller.verify2FA({ userId: 0, code: '' } as any),
      ).rejects.toThrow('Missing parameters');
    });
  });
});
