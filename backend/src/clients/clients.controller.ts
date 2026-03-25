import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentBusiness } from 'src/common/decorators/current-business.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(
    @CurrentBusiness() businessId: number,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(dto, businessId);
  }

  @Get()
  findAll(@CurrentBusiness() businessId: number) {
    return this.clientsService.findAll(businessId);
  }

  @Get('search')
  search(
    @CurrentBusiness() businessId: number,
    @Query('q') q: string,
  ) {
    return this.clientsService.search(q, businessId);
  }

  @Patch(':id')
  update(
    @CurrentBusiness() businessId: number,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(+id, dto, businessId);
  }

  @Delete(':id')
  remove(
    @CurrentBusiness() businessId: number,
    @Param('id') id: string,
  ) {
    return this.clientsService.remove(+id, businessId);
  }
}