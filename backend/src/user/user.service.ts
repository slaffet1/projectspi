import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class UserService {
     constructor(private prisma: PrismaService, private emailService: EmailService,private jwtService: JwtService) {}
     async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
 const token = randomBytes(32).toString('hex');
     const user = await this.prisma.user.create({
    data: {
      ...dto,
      password: hashed,
 emailVerificationToken: token,
    },
  });
 await this.emailService.sendVerificationEmail(user.email, token);
  return { message: 'User created verification email sent' };
  }
   async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return { access_token: token, user: { id: user.id, email: user.email, firstName: user.firstname ,lastName:user.lastname , 
      phone:user.phoneNumber } };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
  if (!userId) throw new Error("userId manquant");

  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { password: true }, 
  });
console.log("user",user)
console.log("current",oldPassword)
console.log("new",newPassword)
  if (!user) throw new Error("Utilisateur introuvable");

  // Vérifier ancien mot de passe
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new Error("Ancien mot de passe incorrect");

  // Hacher le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await this.prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Mot de passe mis à jour" };
}
 async resetPassword(email: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const hashed = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({ where: { email }, data: { password: hashed } });
  }
  async verifyEmail(token: string) {
  const user = await this.prisma.user.findFirst({
    where: { emailVerificationToken: token },
  });

  if (!user) throw new BadRequestException('Invalid token');

  return this.prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
    },
  });
}
}
