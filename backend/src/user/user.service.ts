import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) { }

  async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('Email already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    const token = randomBytes(32).toString('hex');

    const user = await this.prisma.users.create({
      data: {
        email: dto.email,
        firstname: dto.firstname,
        lastname: dto.lastname,
        password: hashed,
        phone_number: dto.phoneNumber,
        email_verification_token: token,
      },
    });

    await this.emailService.sendVerificationEmail(user.email, token);
    return { message: 'User created, verification email sent' };
  }

  async login(email: string, password: string, twofaCode?: string) {
    // Find user
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Check 2FA
    if (user.twofa_enabled) {
      if (!twofaCode) {
        // Frontend must ask for 2FA code
        return { requires2FA: true, userId: user.id };
      }

      const valid2FA = speakeasy.totp.verify({
        secret: user.twofa_secret!,
        encoding: 'base32',
        token: twofaCode,
        window: 1, // allow ±1 step for clock drift
      });

      if (!valid2FA) throw new UnauthorizedException('Invalid 2FA code');
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname,
        phone: user.phone_number,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    if (!userId) throw new Error('userId manquant');

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) throw new Error('Utilisateur introuvable');

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) throw new Error('Ancien mot de passe incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Mot de passe mis à jour' };
  }

  async resetPassword(email: string, newPassword: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const hashed = await bcrypt.hash(newPassword, 10);
    return this.prisma.users.update({
      where: { email },
      data: { password: hashed },
    });
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.users.findFirst({
      where: { email_verification_token: token },
    });
    if (!user) throw new BadRequestException('Invalid token');

    return this.prisma.users.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        email_verification_token: null,
      },
    });
  }
  async updateUser(userId: number, dto: UpdateUserDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.users.update({
      where: { id: userId },
      data: {
        firstname: dto.firstname ?? user.firstname,
        lastname: dto.lastname ?? user.lastname,
        phone_number: dto.phoneNumber ?? user.phone_number,
        email: dto.email ?? user.email,
      },
    });
  }
  async setup2FA(userId: number) {
    const secret = speakeasy.generateSecret({
      name: `MySaaS (${userId})`,
    });

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        twofa_secret: secret.base32,
      },
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return { qrCode };
  }
  async enable2FA(userId: number, token: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    // ✅ ADD THIS CHECK
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twofa_secret) {
      throw new BadRequestException('2FA not initialized');
    }

    const valid = speakeasy.totp({
      secret: user.twofa_secret,
      encoding: 'base32',
      token,
    });

    if (!valid)
      throw new BadRequestException('Invalid code');

    await this.prisma.users.update({
      where: { id: userId },
      data: { twofa_enabled: true },
    });

    return { message: '2FA enabled' };
  }
  async verify2FA(userId: number, token: string) {
  const user = await this.prisma.users.findUnique({ where: { id: userId } });
  if (!user || !user.twofa_secret || !user.twofa_enabled) {
    throw new BadRequestException("2FA not enabled");
  }

  const valid = speakeasy.totp({ secret: user.twofa_secret, encoding: "base32", token });
  if (!valid) throw new UnauthorizedException("Invalid 2FA code");

  // Generate JWT
  const payload = { sub: user.id, email: user.email };
  const tokenJwt = this.jwtService.sign(payload);

  return { access_token: tokenJwt };
}
}
