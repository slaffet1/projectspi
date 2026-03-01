import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompanyService } from './company.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

/**
 * All routes are protected by JWT.
 * Role / Permission guards run after the JWT guard, so req.user is always set.
 */
@Controller('businesses')
@UseGuards(AuthGuard('jwt'))
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // ─── POST /businesses ──────────────────────────────────────────────────────
  // Any authenticated user can create a business; they become its OWNER.
  @Post()
  create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateBusinessDto,
  ) {
    return this.companyService.create(userId, dto);
  }

  // ─── GET /businesses/my ────────────────────────────────────────────────────
  // "View Business List" — all businesses the current user belongs to.
  @Get('my')
  findMine(@CurrentUser('id') userId: number) {
    return this.companyService.findAllForUser(userId);
  }

  // ─── POST /businesses/:businessId/switch ──────────────────────────────────
  // "Switch Active Business" — validates membership and returns context.
  @Post(':businessId/switch')
  @HttpCode(HttpStatus.OK)
  switchActive(
    @CurrentUser('id') userId: number,
    @Param('businessId', ParseIntPipe) businessId: number,
  ) {
    return this.companyService.switchActiveBusiness(userId, businessId);
  }

  // ─── GET /businesses/:businessId ──────────────────────────────────────────
  // Any member can view the business profile.
  @Get(':businessId')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  findOne(
    @CurrentUser('id') userId: number,
    @Param('businessId', ParseIntPipe) businessId: number,
  ) {
    return this.companyService.findOne(userId, businessId);
  }

  // ─── PATCH /businesses/:businessId ────────────────────────────────────────
  // "Edit Business Profile" — OWNER only.
  @Patch(':businessId')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER)
  @RequirePermissions('business:update')
  update(
    @CurrentUser('id') userId: number,
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.companyService.update(userId, businessId, dto);
  }

  // ─── DELETE /businesses/:businessId ───────────────────────────────────────
  // OWNER only.
  @Delete(':businessId')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER)
  @RequirePermissions('business:delete')
  remove(
    @CurrentUser('id') userId: number,
    @Param('businessId', ParseIntPipe) businessId: number,
  ) {
    return this.companyService.remove(userId, businessId);
  }

  // ─── GET /businesses/:businessId/members ──────────────────────────────────
  // Any member can list members.
  @Get(':businessId/members')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @RequirePermissions('member:read')
  getMembers(
    @CurrentUser('id') userId: number,
    @Param('businessId', ParseIntPipe) businessId: number,
  ) {
    return this.companyService.getMembers(userId, businessId);
  }

  // ─── DELETE /businesses/:businessId/members/:userId ───────────────────────
  // OWNER or ADMIN can remove members.
  @Delete(':businessId/members/:userId')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @RequirePermissions('member:remove')
  removeMember(
    @CurrentUser('id') requesterId: number,
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
  ) {
    return this.companyService.removeMember(requesterId, businessId, targetUserId);
  }
}