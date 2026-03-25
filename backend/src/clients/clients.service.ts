import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // ✅ Add Client (US-27)
  create(data: CreateClientDto, businessId: number) {
    return this.prisma.clients.create({
      data: {
        ...data,
        business_id: businessId,
      },
    });
  }

  // ✅ Get All Clients (US-30)
  findAll(businessId: number) {
    return this.prisma.clients.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: 'desc' },
    });
  }

  // ✅ Search / Filter (US-31)
  search(query: string, businessId: number) {
    return this.prisma.clients.findMany({
      where: {
        business_id: businessId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }

  // ✅ Update (US-28)
  update(id: number, data: UpdateClientDto, businessId: number) {
  return this.prisma.clients.updateMany({
    where: {
      id,
      business_id: businessId,
    },
    data,
  });
}

  // ✅ Delete (US-28)
 remove(id: number, businessId: number) {
  return this.prisma.clients.deleteMany({
    where: {
      id,
      business_id: businessId,
    },
  });
}}
