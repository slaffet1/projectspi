import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [PrismaModule,
    MulterModule.register({
      storage:memoryStorage(),
    })
  ],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}
