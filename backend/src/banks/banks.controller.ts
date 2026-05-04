import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BanksService } from './banks.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { PermissionsGuard, RequirePermission } from 'src/permissions/permissions/permissions.guard';

@UseGuards(AuthGuard('jwt'))
@Controller('banks')
@RequirePermission('banks')
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

@Post()
create(
  @Body() dto: CreateBankDto,
  @Query('businessId') businessId: string,
) {
  return this.banksService.create(dto, Number(businessId));
}

@Get()
findAll(@Query('businessId') businessId: string) {
  return this.banksService.findAll(Number(businessId));
}

  @Get('search')
  search(@Query('q') q: string, @Req() req: any) {
    const businessId = req.user.businessId;
    return this.banksService.search(q, businessId);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateBankDto, @Req() req: any) {
    const businessId = req.user.businessId;
    return this.banksService.update(id, dto, businessId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const businessId = req.user.businessId;
    return this.banksService.remove(id, businessId);
  }
}
