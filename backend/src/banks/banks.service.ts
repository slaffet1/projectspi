import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBankDto } from './dto/create-bank.dto';

@Injectable()
export class BanksService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateBankDto, businessId: number) {
    return this.prisma.banks.create({
      data: {
        ...data,
        business_id: businessId,
      },
    });
  }

  findAll(businessId: number) {
    return this.prisma.banks.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });
  }

  search(query: string, businessId: number) {
    return this.prisma.banks.findMany({
      where: {
        business_id: businessId,
        OR: [
          { bank_name: { contains: query, mode: 'insensitive' } },
          { account_number: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }

  update(id: number, data: Partial<CreateBankDto>, businessId: number) {
    return this.prisma.banks.updateMany({
      where: { id, business_id: businessId },
      data,
    });
  }

  remove(id: number, businessId: number) {
    return this.prisma.banks.deleteMany({
      where: { id, business_id: businessId },
    });
  }
}
