import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';

jest.mock('bcrypt');
jest.mock('speakeasy');
jest.mock('qrcode', () => ({ toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock') }));
jest.mock('crypto', () => ({ randomBytes: jest.fn(() => ({ toString: () => 'mock-token-hex' })) }));

const mockPrisma = {
  users: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  // ─── createUser ───────────────────────────────────────────────────────────

  describe('createUser', () => {
    const dto = { email: 'test@test.com', firstname: 'John', lastname: 'Doe', password: 'pass123', phoneNumber: '0600000000' };

    it('should create a user and send a verification email', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrisma.users.create.mockResolvedValue({ id: 1, email: dto.email });
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.createUser(dto);

      expect(mockPrisma.users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: dto.email, password: 'hashed-password' }),
        }),
      );
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(dto.email, 'mock-token-hex');
      expect(result).toEqual({ message: 'User created, verification email sent' });
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ id: 1, email: dto.email });

      await expect(service.createUser(dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    const user = { id: 1, email: 'test@test.com', password: 'hashed', twofa_enabled: false, firstname: 'John', lastname: 'Doe', phone_number: '06' };

    it('should return access_token on valid credentials', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(user.email, 'pass123');

      expect(result).toEqual(expect.objectContaining({ access_token: 'mock-jwt-token' }));
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.login('unknown@test.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(user.email, 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('should return requires2FA if 2FA is enabled and no code provided', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ ...user, twofa_enabled: true, twofa_secret: 'secret' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(user.email, 'pass123');

      expect(result).toEqual({ requires2FA: true, userId: user.id });
    });
    /*
        it('should throw UnauthorizedException if 2FA code is invalid', async () => {
          mockPrisma.users.findUnique.mockResolvedValue({ ...user, twofa_enabled: true, twofa_secret: 'secret' });
          (bcrypt.compare as jest.Mock).mockResolvedValue(true);
          (speakeasy.totp.verify as jest.Mock) = jest.fn().mockReturnValue(false);
    
          await expect(service.login(user.email, 'pass123', '000000')).rejects.toThrow(UnauthorizedException);
        });*/
  });

  // ─── getProfile ───────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('should return a user by id', async () => {
      const user = { id: 1, email: 'test@test.com' };
      mockPrisma.users.findUnique.mockResolvedValue(user);

      const result = await service.getProfile(1);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── changePassword ───────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('should update password successfully', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ password: 'hashed-old' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new');
      mockPrisma.users.update.mockResolvedValue({});

      const result = await service.changePassword(1, 'oldPass', 'newPass');
      expect(result).toEqual({ message: 'Mot de passe mis à jour' });
    });

    it('should throw if old password is wrong', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ password: 'hashed-old' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, 'wrong', 'newPass')).rejects.toThrow('Ancien mot de passe incorrect');
    });
  });

  // ─── verifyEmail ──────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockPrisma.users.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.users.update.mockResolvedValue({ id: 1, email_verified: true });

      const result = await service.verifyEmail('valid-token');
      expect(mockPrisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { email_verified: true, email_verification_token: null } }),
      );
      expect(result).toEqual(expect.objectContaining({ email_verified: true }));
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockPrisma.users.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── setup2FA ─────────────────────────────────────────────────────────────


});