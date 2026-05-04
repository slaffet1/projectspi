import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions/permissions.service';
import { PermissionsController } from './permissions/permissions.controller';


@Module({
  providers: [PermissionsService],
  controllers: [PermissionsController],

})
export class PermissionsModule {}
