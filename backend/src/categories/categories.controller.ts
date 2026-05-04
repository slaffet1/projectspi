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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('api/businesses/:businessId/categories')
@UseGuards(AuthGuard('jwt'))

export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @RequirePermissions('category:create')
  create(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(businessId, dto);
  }

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @RequirePermissions('category:read')
  findAll(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.categoriesService.findAll(businessId);
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @RequirePermissions('category:update')
  update(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(businessId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @RequirePermissions('category:delete')
  remove(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.remove(businessId, id);
  }
}