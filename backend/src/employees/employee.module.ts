import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Assurez-vous d'importer votre PrismaModule ici

@Module({
  imports: [PrismaModule], 
  controllers: [EmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule {}