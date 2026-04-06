import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ajustez le chemin selon votre structure

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  // 1. Création d'un Bon de Commande (Statut: DRAFT)
  async create(businessId: number, data: any) {
    // Génération automatique du numéro de commande (ex: PO-2026-001)
    const orderCount = await this.prisma.purchase_orders.count({
      where: { business_id: businessId }
    });
    const orderNumber = `PO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, '0')}`;

    return this.prisma.purchase_orders.create({
      data: {
        business_id: businessId,
        supplier_id: data.supplier_id,
        order_number: orderNumber,
        order_date: new Date(data.order_date),
        expected_date: data.expected_date ? new Date(data.expected_date) : null,
        total_amount: data.total_amount,
        notes: data.notes,
        status: 'DRAFT',
        items: {
          create: data.items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price,
          }))
        }
      },
      include: { items: true }
    });
  }

  // 2. La Transaction Magique : Validation -> Dépense -> Stock
  async validateOrder(businessId: number, id: number) {
    const order = await this.prisma.purchase_orders.findFirst({
      where: { id, business_id: businessId },
      include: { items: true, fournisseurs: true }
    });

    if (!order) throw new NotFoundException('Bon de commande introuvable');
    if (order.status === 'VALIDATED') throw new BadRequestException('Ce bon est déjà validé');

    // On utilise $transaction pour sécuriser les 3 opérations
    return this.prisma.$transaction(async (prisma) => {
      
      // A. Mettre à jour le statut du BC
      const updatedOrder = await prisma.purchase_orders.update({
        where: { id },
        data: { status: 'VALIDATED' }
      });

      // B. Créer la Dépense en comptabilité
      await prisma.expenses.create({
        data: {
          label: `Achat - ${order.fournisseurs?.name || 'Fournisseur'} (${order.order_number})`,
          amount: order.total_amount,
          expense_date: new Date(),
          business_id: businessId,
          purchase_order_id: order.id,
        }
      });

      // C. Pour chaque ligne d'article, mettre à jour le stock
      for (const item of order.items) {
        if (item.product_id) {
          // C1. Enregistrer le mouvement d'entrée pour l'historique
          await prisma.mouvements.create({
            data: {
              mouvement_date: new Date(),
              quantity: item.quantity,
              type: 'IN', // Type Défini dans votre Enum Prisma
              product_id: item.product_id,
              note: `Réception BC ${order.order_number}`
            }
          });

          // C2. Mettre à jour la quantité totale dans la table 'inventaires'
          const inventaire = await prisma.inventaires.findFirst({
            where: { product_id: item.product_id }
          });

          if (inventaire) {
            await prisma.inventaires.update({
              where: { id: inventaire.id },
              data: { quantity_available: { increment: item.quantity } }
            });
          } else {
            // Si le produit n'était pas encore suivi en inventaire, on l'initialise
            await prisma.inventaires.create({
              data: {
                product_id: item.product_id,
                quantity_available: item.quantity,
                minimum_quantity: 0
              }
            });
          }
        }
      }

      return updatedOrder;
    });
  }

  // 3. Récupérer la liste des bons de commande
  async findAll(businessId: number) {
    return this.prisma.purchase_orders.findMany({
      where: { business_id: businessId },
      include: { fournisseurs: true, _count: { select: { items: true } } },
      orderBy: { created_at: 'desc' }
    });
  }
}