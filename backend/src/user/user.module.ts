import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
@Module({
   imports: [
    PassportModule,
    JwtModule.register({
      secret: '87f0ff6df87bee9fc5f2bc480668d1ee',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [UserService,PrismaService,EmailService,JwtStrategy,JwtModule],
  controllers: [UserController]
})
export class UserModule {}
