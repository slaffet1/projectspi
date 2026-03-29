import { Injectable, NotFoundException } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  async generate(invoiceId: number): Promise<Buffer> {
    // Récupération de la facture avec les détails du devis et du client
    const invoice = await this.prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        quotes: {
          include: {
            clients: true,
            quote_details: { include: { products: true } },
          },
        },
      },
    });

    if (!invoice) throw new NotFoundException("Facture introuvable");

    const client = invoice.quotes?.clients;
    if (!client || !client.business_id) {
      throw new NotFoundException("Client ou société introuvable pour cette facture");
    }

    const business = await this.prisma.businesses.findUnique({
      where: { id: client.business_id },
    });
    const prefix = business?.invoice_prefix || "INV-";

    const doc = new PDFDocument({ margin: 40 });
    const buffers: Uint8Array[] = [];
    doc.on("data", buffers.push.bind(buffers));

    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // ─── HEADER ─────────────────────────────
      doc.fontSize(22).text("FACTURE", { align: "center" });
      doc.moveDown();
      doc.fontSize(12);

      doc.text(`Numéro: ${prefix}${invoice.invoice_number}`);
      doc.text(`Client: ${client.name}`);
      doc.text(`Date: ${invoice.issue_date.toDateString()}`);
      doc.text(`Échéance: ${invoice.due_date.toDateString()}`);
      doc.moveDown();

      // ─── TABLE DES PRODUITS ─────────────────
      doc.text("Articles:", { underline: true });
      let totalHT = 0;
      let totalTax = 0;

      const quoteDetails = invoice.quotes?.quote_details || [];
      quoteDetails.forEach((item) => {
        const product = item.products;
        if (!product) return;

        const price = Number(product.unit_price);
        const taxRate = Number(product.tax_rate || 0);
        const lineTotal = item.quantity * price;
        const lineTax = lineTotal * (taxRate / 100);

        totalHT += lineTotal;
        totalTax += lineTax;

        doc.text(
          `${product.name} | Qté: ${item.quantity} | PU: ${price.toFixed(
            2
          )} DT | TVA: ${taxRate}% | Total: ${(lineTotal + lineTax).toFixed(2)} DT`
        );
      });

      doc.moveDown();
      doc.text(`Total HT: ${totalHT.toFixed(2)} DT`, { align: "right" });
      doc.text(`Total TVA: ${totalTax.toFixed(2)} DT`, { align: "right" });

      // Pour le Total TTC en gras, changer la police
      doc.font("Helvetica-Bold").text(
        `Total TTC: ${(totalHT + totalTax).toFixed(2)} DT`,
        { align: "right" }
      );

      doc.end();
    });
  }
}