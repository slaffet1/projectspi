import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}


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
}