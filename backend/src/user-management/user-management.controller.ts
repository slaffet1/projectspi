import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('user-management')
@UseGuards(AuthGuard('jwt'))
export class UserManagementController {
  constructor(private readonly service: UserManagementService) {}

  // JOIN COMPANY
  @Post('join-company')
  async joinCompany(
    @Request() req,
    @Body() dto: CreateJoinRequestDto,
  ) {
    return this.service.createJoinRequest(
      req.user.id,
      dto.matricule_fiscale,
    );
  }

  // GET REQUESTS
  @Get('join-requests/:businessId')
  async getRequests(@Param('businessId') businessId: string) {
    return this.service.getJoinRequests(+businessId);
  }

  // APPROVE
  @Post('approve-request')
  async approve(
    @Body() body: { requestId: number; roleId: number },
  ) {
    return this.service.approveRequest(
      body.requestId,
      body.roleId,
    );
  }

  // REJECT
  @Delete('reject-request/:id')
  async reject(@Param('id') id: string) {
    return this.service.rejectRequest(+id);
  }

  // ROLES
  @Get('roles')
  async getRoles() {
    return this.service.getRoles();
  }
}