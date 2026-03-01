import { Module } from '@nestjs/common';
import { InviteUsersController } from './invite-users.controller';
import { InviteUsersService } from './invite-users.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  controllers: [InviteUsersController],
  providers: [InviteUsersService],
})
export class InviteUsersModule {}