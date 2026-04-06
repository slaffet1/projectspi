import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('api/businesses/:businessId/expenses')
@UseGuards(AuthGuard('jwt'))
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @RequirePermissions('expense:create')
  create(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(businessId, dto);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @RequirePermissions('expense:read')
  findAll(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.expensesService.findAll(businessId);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @RequirePermissions('expense:read')
  findOne(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expensesService.findOne(businessId, id);
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @RequirePermissions('expense:update')
  update(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(businessId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @RequirePermissions('expense:delete')
  remove(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.expensesService.remove(businessId, id);
  }
}