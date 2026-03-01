import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { InviteUsersService } from './invite-users.service';

@Controller('api/businesses')
export class InviteUsersController {
  constructor(private readonly service: InviteUsersService) {}

  // POST /api/businesses/:id/invite
  @Post(':id/invite')
  async inviteUser(
    @Param('id') id: string,
    @Body() body: { email: string; role_id: number },
  ) {
    return this.service.inviteUser(Number(id), body.email, body.role_id);
  }

  // GET /api/businesses/:id/members
  @Get(':id/members')
  async getBusinessMembers(@Param('id') id: string) {
    return this.service.getBusinessMembers(Number(id));
  }

  // GET /api/businesses/:id/invitations
  @Get(':id/invitations')
  async getPendingInvitations(@Param('id') id: string) {
    return this.service.getPendingInvitations(Number(id));
  }

  // DELETE /api/businesses/:id/members/:userId
  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.service.removeMember(Number(id), Number(userId));
  }

  // DELETE /api/businesses/:id/invitations/:invitationId
  @Delete(':id/invitations/:invitationId')
  async cancelInvitation(
    @Param('invitationId') invitationId: string,
  ) {
    return this.service.cancelInvitation(Number(invitationId));
  }

  // POST /api/businesses/accept-invitation
  @Post('accept-invitation')
  async acceptInvitation(
    @Body() body: { token: string; user_id: number },
  ) {
    return this.service.acceptInvitation(body.token, body.user_id);
  }
}