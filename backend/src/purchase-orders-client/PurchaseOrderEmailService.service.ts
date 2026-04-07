// src/purchase-orders/email/purchase-order-email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as puppeteer from 'puppeteer';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PurchaseOrderEmailService {


  private readonly baseUrl = 'https://unpostponable-tony-ontically.ngrok-free.dev';

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mohamedaminechoukani02@gmail.com',
      pass: 'qtrx kzmw tpry dkgn',
    },
  });

  constructor(private prisma: PrismaService) { }

  // ─── Render purchase-order HTML (PDF attachment) ─────────────────────────

  private renderOrderHtml(order: any): string {
    const businessName = order.clients?.businesses?.name || 'Business';
    const client = order.clients;
    const items = order.order_details || [];

    const subtotal = items.reduce(
      (s: number, i: any) => s + i.quantity * Number(i.products?.unit_price || 0),
      0,
    );
    const tax = items.reduce(
      (s: number, i: any) =>
        s + i.quantity * Number(i.products?.unit_price || 0) * (Number(i.products?.tax_rate || 0) / 100),
      0,
    );
    const total = subtotal + tax;

    const rows = items.map((i: any) => {
      const line = i.quantity * Number(i.products?.unit_price || 0) * (1 + Number(i.products?.tax_rate || 0) / 100);
      return `
        <tr>
          <td style="padding:10px 12px;border:1px solid #ddd;font-size:13px">${i.products?.name}</td>
          <td style="padding:10px 12px;border:1px solid #ddd;text-align:right;font-size:13px">${i.quantity}</td>
          <td style="padding:10px 12px;border:1px solid #ddd;text-align:right;font-size:13px">${Number(i.products?.unit_price || 0).toFixed(2)} DT</td>
          <td style="padding:10px 12px;border:1px solid #ddd;text-align:right;font-size:13px">${Number(i.products?.tax_rate || 0)}%</td>
          <td style="padding:10px 12px;border:1px solid #ddd;text-align:right;font-weight:600;font-size:13px">${line.toFixed(2)} DT</td>
        </tr>`;
    }).join('');

    return `
    <html><head><style>
      body{font-family:Arial,sans-serif;padding:30px;color:#000}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th{background:#f5f5f5;padding:10px 12px;border:1px solid #ddd;text-align:left;font-size:13px}
    </style></head><body>
    <div style="max-width:800px;margin:auto">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:22px;font-weight:bold">${businessName}</div>
          <div style="color:#888;font-size:13px">Purchase Order</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:bold">PURCHASE ORDER</div>
          <div style="color:#888;font-size:13px">#${order.order_number}</div>
          <div style="color:#888;font-size:13px">${new Date(order.issue_date).toLocaleDateString('en-GB')}</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:28px">
        <div>
          <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px">Ordered by</div>
          <div style="font-weight:600;font-size:15px">${client?.name}</div>
          <div style="color:#555;font-size:13px">${client?.email}</div>
        </div>
        <div style="text-align:right">
          <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px">Expiration</div>
          <div style="font-weight:600;font-size:14px">${new Date(order.expiration_date).toLocaleDateString('en-GB')}</div>
        </div>
      </div>

      <table>
        <thead><tr>
          <th>Product</th><th style="text-align:right">Qty</th>
          <th style="text-align:right">Unit Price</th><th style="text-align:right">VAT</th>
          <th style="text-align:right">Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-top:20px">
        <div style="width:280px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px">
            <span style="color:#888">Subtotal</span><span>${subtotal.toFixed(2)} DT</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:14px">
            <span style="color:#888">VAT</span><span>${tax.toFixed(2)} DT</span>
          </div>
          <hr style="border-color:#ddd"/>
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold">
            <span>Total</span><span>${total.toFixed(2)} DT</span>
          </div>
        </div>
      </div>

      <div style="text-align:center;margin-top:48px;font-size:12px;color:#888">
        Thank you for your order — ${businessName}
      </div>
    </div>
    </body></html>`;
  }

  // ─── Generate PDF attachment ──────────────────────────────────────────────

  async generatePdf(order: any): Promise<Buffer> {
    const html = this.renderOrderHtml(order);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfArray = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });
    await browser.close();
    return Buffer.from(pdfArray);
  }

  // ─── Send email with Accept / Reject buttons ──────────────────────────────

  async sendPurchaseOrder(to: string, order: any) {
    //const pdfBuffer = await this.generatePdf(order);
    const acceptUrl = `${this.baseUrl}/api/purchase-orders-client/${order.id}/respond?action=accept`;
    const rejectUrl = `${this.baseUrl}/api/purchase-orders-client/${order.id}/respond?action=reject`;
    const businessName = order.clients?.businesses?.name;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
          <h2 style="color:#1e293b;margin-top:0">Purchase Order #${order.order_number}</h2>
          <p style="color:#475569">Hello <strong>${order.clients?.name}</strong>,</p>
          <p style="color:#475569">
            Please find your purchase order attached. We kindly ask you to confirm or decline your order
            by clicking one of the buttons below.
          </p>

          <!-- CTA Buttons -->
          <div style="display:flex;gap:16px;margin:32px 0">
            <a href="${acceptUrl}"
              style="flex:1;display:inline-block;text-align:center;padding:14px 24px;
                     background:#16a34a;color:#fff;font-weight:700;font-size:15px;
                     text-decoration:none;border-radius:8px;letter-spacing:.3px">
              ✅ Accept Order
            </a>
            <a href="${rejectUrl}"
              style="flex:1;display:inline-block;text-align:center;padding:14px 24px;
                     background:#dc2626;color:#fff;font-weight:700;font-size:15px;
                     text-decoration:none;border-radius:8px;letter-spacing:.3px">
              ❌ Decline Order
            </a>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin:0">
            This link can be opened on your phone. No account is required.<br/>
            If you did not request this order, you can safely ignore this email.
          </p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:20px">
          © ${new Date().getFullYear()} ${businessName}. All rights reserved.
        </p>
      </div>`;

    await this.transporter.sendMail({
      from: `"${businessName}" <${process.env.EMAIL_USER || 'mohamedaminechoukani02@gmail.com'}>`,
      to,
      subject: `Purchase Order #${order.order_number} — Action Required`,
      html,
      attachments: [{
        filename: `purchase-order-${order.order_number}.pdf`,
        //content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    console.log(`Purchase order #${order.order_number} sent to ${to}`);
  }
}