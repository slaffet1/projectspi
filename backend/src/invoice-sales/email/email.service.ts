// src/invoice-sales/email/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as puppeteer from 'puppeteer';

@Injectable()
export class EmailService {
  // Création du transporteur SMTP (ici Gmail)
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mohamedaminechoukani02@gmail.com', // ton email
      pass: 'qtrx kzmw tpry dkgn', // mot de passe ou App Password Gmail
    },
  });

  // Générer le HTML de la facture (UI identique à ta capture)
private renderInvoiceHtml(invoice: any): string {
  const businessName =  invoice.quotes?.clients?.businesses?.name ;
  const client = invoice.quotes.clients;
  const items = invoice.quotes.quote_details;

  const subtotal = items.reduce(
    (s, i) => s + i.quantity * Number(i.products.unit_price),
    0
  );

  const tax = items.reduce(
    (s, i) =>
      s +
      i.quantity *
        Number(i.products.unit_price) *
        (Number(i.products.tax_rate) / 100),
    0
  );

  const total = subtotal + tax;

  const itemsRows = items.map((i: any) => {
    const totalLine =
      i.quantity *
      Number(i.products.unit_price) *
      (1 + Number(i.products.tax_rate) / 100);

    return `
      <tr>
        <td class="p-10 border">${i.products.name}</td>
        <td class="p-10 border text-right">${i.quantity}</td>
        <td class="p-10 border text-right">${Number(i.products.unit_price).toFixed(2)} DT</td>
        <td class="p-10 border text-right">${Number(i.products.tax_rate)}%</td>
        <td class="p-10 border text-right font-bold">${totalLine.toFixed(2)} DT</td>
      </tr>
    `;
  }).join('');

  return `
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 30px;
        color: #000;
      }
      .container {
        max-width: 800px;
        margin: auto;
      }
      .flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .text-right { text-align: right; }
      .text-gray { color: #666; }
      .title { font-size: 24px; font-weight: bold; }
      .subtitle { font-size: 14px; color: #888; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      th, td {
        padding: 10px;
        border: 1px solid #ddd;
      }
      th {
        background: #f5f5f5;
        text-align: left;
      }
      .totals {
        margin-top: 20px;
        width: 300px;
        margin-left: auto;
      }
      .totals div {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      .total-final {
        font-size: 18px;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        margin-top: 50px;
        font-size: 12px;
        color: #888;
      }
    </style>
  </head>

  <body>
    <div class="container">

      <!-- HEADER -->
      <div class="flex">
        <div>
          <div class="title">${businessName}</div>
          <div class="subtitle">Facturation professionnelle</div>
        </div>

        <div class="text-right">
          <div class="title">FACTURE</div>
          <div class="text-gray">#${invoice.invoice_number}</div>
          <div class="text-gray">${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</div>
        </div>
      </div>

      <!-- CLIENT -->
      <div style="margin-top: 30px;" class="flex">
        <div>
          <div class="subtitle">FACTURÉ À</div>
          <div><b>${client.name}</b></div>
          <div class="text-gray">${client.email}</div>
        </div>

        <div class="text-right">
          <div><span class="text-gray">Échéance:</span> ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}</div>
          <div><span class="text-gray">Statut:</span> ${invoice.status.toUpperCase()}</div>
        </div>
      </div>

      <!-- TABLE -->
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th class="text-right">Qté</th>
            <th class="text-right">Prix</th>
            <th class="text-right">TVA</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- TOTAL -->
      <div class="totals">
        <div><span>Sous-total</span><span>${subtotal.toFixed(2)} DT</span></div>
        <div><span>TVA</span><span>${tax.toFixed(2)} DT</span></div>
        <hr/>
        <div class="total-final"><span>Total</span><span>${total.toFixed(2)} DT</span></div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        Merci pour votre confiance — ${businessName}
      </div>

    </div>
  </body>
  </html>
  `;
}

  // Générer le PDF à partir du HTML
  async generatePdf(invoice: any): Promise<Buffer> {
    const html = this.renderInvoiceHtml(invoice);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfArray = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });

    await browser.close();

    // Convertir Uint8Array en Buffer pour Nodemailer
    return Buffer.from(pdfArray);
  }

  // Envoyer la facture par email
  async sendInvoice(to: string, invoice: any) {
    const pdfBuffer = await this.generatePdf(invoice);

    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2 style="color: #1E90FF;">Facture #${invoice.invoice_number}</h2>
        <p>Bonjour,</p>
        <p>Veuillez trouver votre facture en pièce jointe.</p>
        <hr style="margin-top: 30px;">
        <p style="font-size: 12px; color: #888;">&copy; 2026 ${invoice.business?.name || 'MonApplication'}. Tous droits réservés.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: '"MonApplication" <mohamedaminechoukani02@gmail.com>',
      to,
      subject: `Votre facture #${invoice.invoice_number}`,
      html,
      attachments: [
        {
          filename: `facture-${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`Facture #${invoice.invoice_number} envoyée à ${to}`);
  }
}