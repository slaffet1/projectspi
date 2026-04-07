import { Controller, Get, Param, Query, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
 
@Controller('api/purchase-orders-client')
export class PublicPurchaseOrderController {
  constructor(private prisma: PrismaService) {}
 
 
  @Get(':id/respond')
  async respondToOrder(
    @Param('id', ParseIntPipe) id: number,
    @Query('action') action: 'accept' | 'reject',
    @Res() res: Response,
  ) {
    const order = await this.prisma.purchase_orders_client.findUnique({
      where: { id },
      include: { clients: true },
    });
 
    if (!order) {
      return res.status(404).send(this.renderPage('Not Found', 'This purchase order does not exist.', false));
    }
 
    // Idempotent — already processed
    if (order.status === 'confirmed' && action === 'accept') {
      return res.send(this.renderPage(
        'Already Confirmed ✅',
        'You have already accepted this order. Your invoice will be sent shortly.',
        true,
      ));
    }
    if (order.status === 'cancelled' && action === 'reject') {
      return res.send(this.renderPage(
        'Already Declined',
        'You have already declined this order.',
        false,
      ));
    }
 
    if (action === 'accept') {
      await this.prisma.purchase_orders_client.update({
        where: { id },
        data:  { status: 'confirmed' },
      });
 
      return res.send(this.renderPage(
        '✅ Order Accepted!',
        `Thank you, ${order.clients?.name || 'valued client'}! Your order <strong>#${order.order_number}</strong> has been confirmed.<br/><br/>
         You will receive your invoice shortly. We appreciate your business!`,
        true,
      ));
    }
 
    if (action === 'reject') {
      await this.prisma.purchase_orders_client.update({
        where: { id },
        data:  { status: 'cancelled' },
      });
 
      return res.send(this.renderPage(
        '❌ Order Declined',
        `We have received your response. Order <strong>#${order.order_number}</strong> has been cancelled.<br/><br/>
         If you changed your mind or have any questions, please contact us directly.`,
        false,
      ));
    }
 
    return res.status(400).send(this.renderPage('Invalid Action', 'Unknown action requested.', false));
  }
 
  // ── Minimal branded HTML page ─────────────────────────────────────────────
 
  private renderPage(title: string, message: string, success: boolean): string {
    const color = success ? '#16a34a' : '#dc2626';
    const bg    = success ? '#f0fdf4' : '#fff1f2';
    const icon  = success ? '✅' : '❌';
 
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: ${bg};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,.10);
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .icon {
      font-size: 56px;
      margin-bottom: 20px;
      display: block;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: ${color};
      margin-bottom: 16px;
    }
    p {
      font-size: 15px;
      color: #475569;
      line-height: 1.7;
    }
    .badge {
      display: inline-block;
      margin-top: 28px;
      padding: 8px 20px;
      background: ${color};
      color: #fff;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: .3px;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="icon">${icon}</span>
    <h1>${title}</h1>
    <p>${message}</p>
    <span class="badge">${success ? 'Confirmed ✓' : 'Declined'}</span>
  </div>
</body>
</html>`;
  }
}