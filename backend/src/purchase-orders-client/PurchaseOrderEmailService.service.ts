import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { chromium } from 'playwright';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PurchaseOrderEmailService {

  private readonly baseUrl =
    'https://unpostponable-tony-ontically.ngrok-free.dev';

  constructor(private prisma: PrismaService) {}

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mohamedaminechoukani02@gmail.com',
      pass: 'qtrx kzmw tpry dkgn',
    },
  });

  // ─────────────────────────────────────────
  // HTML TEMPLATE
  // ─────────────────────────────────────────
  private renderOrderHtml(order: any): string {

    const businessName = order.clients?.businesses?.name || 'Business';
    const client = order.clients;
    const items = order.order_details || [];

    const subtotal = items.reduce(
      (s: number, i: any) =>
        s + i.quantity * Number(i.products?.unit_price || 0),
      0,
    );

    const tax = items.reduce(
      (s: number, i: any) =>
        s +
        i.quantity *
          Number(i.products?.unit_price || 0) *
          (Number(i.products?.tax_rate || 0) / 100),
      0,
    );

    const total = subtotal + tax;

    const rows = items
      .map((i: any) => {
        const line =
          i.quantity *
          Number(i.products?.unit_price || 0) *
          (1 + Number(i.products?.tax_rate || 0) / 100);

        return `
          <tr>
            <td>${i.products?.name}</td>
            <td>${i.quantity}</td>
            <td>${Number(i.products?.unit_price).toFixed(2)} DT</td>
            <td>${Number(i.products?.tax_rate || 0)}%</td>
            <td><b>${line.toFixed(2)} DT</b></td>
          </tr>
        `;
      })
      .join('');

    return `
    <html>
      <body style="font-family:Arial;padding:30px">
        <h2>${businessName}</h2>
        <h3>Purchase Order #${order.order_number}</h3>

        <p><b>Client:</b> ${client?.name}</p>
        <p>${client?.email}</p>

        <table border="1" cellspacing="0" cellpadding="8" width="100%">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>VAT</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <h3>Total: ${total.toFixed(2)} DT</h3>
      </body>
    </html>
    `;
  }

  // ─────────────────────────────────────────
  // PDF GENERATION (PLAYWRIGHT)
  // ─────────────────────────────────────────
  async generatePdf(order: any): Promise<Buffer> {

    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(this.renderOrderHtml(order), {
      waitUntil: 'networkidle',
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
    });

    await browser.close();

    return Buffer.from(pdf);
  }

  // ─────────────────────────────────────────
  // EMAIL SENDING
  // ─────────────────────────────────────────
  async sendPurchaseOrder(to: string, order: any) {

    const pdfBuffer = await this.generatePdf(order);

    const acceptUrl =
      `${this.baseUrl}/api/purchase-orders-client/${order.id}/respond?action=accept`;

    const rejectUrl =
      `${this.baseUrl}/api/purchase-orders-client/${order.id}/respond?action=reject`;

    const businessName =
      order.clients?.businesses?.name || 'Business';

    const html = `
      <h2>Purchase Order #${order.order_number}</h2>

      <p>Hello <b>${order.clients?.name}</b>,</p>

      <p>Please confirm your order:</p>

      <a href="${acceptUrl}"
         style="padding:12px 20px;background:green;color:white;
         text-decoration:none;border-radius:6px">
         ✅ Accept
      </a>

      <a href="${rejectUrl}"
         style="padding:12px 20px;background:red;color:white;
         text-decoration:none;border-radius:6px">
         ❌ Reject
      </a>
    `;

    await this.transporter.sendMail({
      from: `"${businessName}" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Purchase Order #${order.order_number} — Action Required`,
      html,
      attachments: [
        {
          filename: `purchase-order-${order.order_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(
      `Purchase order #${order.order_number} sent to ${to}`,
    );
  }
}