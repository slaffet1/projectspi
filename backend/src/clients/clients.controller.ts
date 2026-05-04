import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentBusiness } from 'src/common/decorators/current-business.decorator';
import { RequirePermission } from 'src/permissions/permissions/permissions.guard';

@UseGuards(AuthGuard('jwt'))
@RequirePermission('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ✅ CREATE avec validation
  @Post()
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  create(
    @CurrentBusiness() businessId: number,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(dto, businessId);
  }

  // ✅ GET
  @Get()
  findAll(@CurrentBusiness() businessId: number) {
    return this.clientsService.findAll(businessId);
  }

  // ✅ SEARCH
  @Get('search')
  search(
    @CurrentBusiness() businessId: number,
    @Query('q') q: string,
  ) {
    return this.clientsService.search(q, businessId);
  }

  // ✅ UPDATE avec validation
  @Patch(':id')
  @UsePipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  update(
    @CurrentBusiness() businessId: number,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(+id, dto, businessId);
  }

  // ✅ DELETE
  @Delete(':id')
  remove(
    @CurrentBusiness() businessId: number,
    @Param('id') id: string,
  ) {
    return this.clientsService.remove(+id, businessId);
  }
}