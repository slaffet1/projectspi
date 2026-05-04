
import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AuthGuard } from '@nestjs/passport';
@Controller('api/businesses/:businessId')
@UseGuards(AuthGuard('jwt')) 

export class PermissionsController {
     constructor(private readonly permissionsService: PermissionsService) {}
 
  // Toutes les permissions existantes dans le système
  @Get('permissions')
  getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }
 @Get('member')
getMembers(@Param('businessId', ParseIntPipe) businessId: number) {
  return this.permissionsService.getMembersWithRoles(businessId);
}
  // Permissions actuelles d'un rôle
  @Get('roles/:roleId/permissions')
  getRolePermissions(@Param('roleId', ParseIntPipe) roleId: number) {
      console.log("roleId");
    return this.permissionsService.getRolePermissions(roleId);
  
  }
 
  // Mettre à jour les permissions d'un rôle
  // body: { permissionIds: number[] }
  @Put('roles/:roleId/permissions')
  updateRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() body: { permissionIds: number[] },
  ) {

    return this.permissionsService.updateRolePermissions(
      roleId,
      body.permissionIds,
    );
  }
}
