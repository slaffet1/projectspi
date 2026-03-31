import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Req, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }


  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    return this.userService.login(email, password);
  }


  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.userService.verifyEmail(token);
  }


  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    const userId = req.user.id;;
    return this.userService.getProfile(userId);
  }


  @UseGuards(AuthGuard('jwt'))
  @Patch('change-password')
  async changePassword(
    @Request() req,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    const userId = req.user.id;
    console.log("req.user:", req.user);
    return this.userService.changePassword(userId, body.oldPassword, body.newPassword);
  }


  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; newPassword: string }) {
    return this.userService.resetPassword(body.email, body.newPassword);
  }
  @UseGuards(AuthGuard('jwt'))
  @Patch('/update-profile')
  async updateProfile(@Request() req, @Body() dto: UpdateUserDto) {
    const userId = req.user.id;
    if (!userId) throw new NotFoundException('User not found');

    const updatedUser = await this.userService.updateUser(userId, dto);

    return {
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstname,
        lastName: updatedUser.lastname,
        phone: updatedUser.phone_number,
      },
    };
  }
  @Post('2fa/setup')
  @UseGuards(AuthGuard('jwt'))
  setup2FA(@Req() req) {
    return this.userService.setup2FA(req.user.id);
  }
  @Post('2fa/enable')
  @UseGuards(AuthGuard('jwt'))
  enable2FA(
    @Req() req,
    @Body('token') token: string,
  ) {
    return this.userService.enable2FA(req.user.id, token);
  }
  @Post('verify-2fa')
  async verify2FA(@Body() body: { userId: number; code: string }) {
    const { userId, code } = body;

    if (!userId || !code) {
      throw new BadRequestException('Missing parameters');
    }

    return this.userService.verify2FA(userId, code);
  }
}