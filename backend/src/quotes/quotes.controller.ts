import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('api/businesses/:businessId/quotes')
@UseGuards(AuthGuard('jwt'))
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  // ── US-33: Create quote ────────────────────────────────────────────────────
  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @RequirePermissions('quote:create')
  create(
    @Param('businessId', ParseIntPipe) businessId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.create(businessId, dto);
  }

  // ── US-36: List all quotes ─────────────────────────────────────────────────
  @Get()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @RequirePermissions('quote:read')
  findAll(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.quotesService.findAll(businessId);
  }

  // ── US-37: Get single quote ────────────────────────────────────────────────
  @Get(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @RequirePermissions('quote:read')
  findOne(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quotesService.findOne(businessId, id);
  }

  // ── US-34: Edit draft quote ────────────────────────────────────────────────
  @Put(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.ADMIN, )
  @RequirePermissions('quote:update')
  update(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(businessId, id, dto);
  }

  // ── US-35: Send quote to client ────────────────────────────────────────────
  @Patch(':id/send')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.ADMIN, )
  @RequirePermissions('quote:update')
  send(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quotesService.send(businessId, id);
  }

  // ── Status transition (accept / reject / cancel) ───────────────────────────
  @Patch(':id/status')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.ADMIN, )
  @RequirePermissions('quote:update')
  updateStatus(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.quotesService.updateStatus(businessId, id, status);
  }

  // ── US-38: Convert to invoice ──────────────────────────────────────────────
  @Post(':id/convert')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.ADMIN, )
  @RequirePermissions('invoice:create')
  convertToInvoice(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quotesService.convertToInvoice(businessId, id);
  }

  // ── US-39: Delete draft quote ──────────────────────────────────────────────
  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(Role.OWNER, Role.ADMIN,)
  @RequirePermissions('quote:delete')
  remove(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quotesService.remove(businessId, id);
  }
}