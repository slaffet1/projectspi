import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiAdvisorService {
  constructor(private prisma: PrismaService) {}

  private async getBusinessContext(businessId: number): Promise<string> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      business, invoices, expenses, products, clients, suppliers,
      quotes, banks, taxes, employees, warehouses, stockMovements,
      purchaseOrders, purchaseOrdersClient, creditNotes,
      inventorySessions, expenseCategories,
    ] = await Promise.all([
      this.prisma.businesses.findUnique({ where: { id: businessId } }),

      this.prisma.invoices.findMany({
        where: { quotes: { clients: { business_id: businessId } } },
        include: { bank: true, quotes: { include: { clients: true } } },
        orderBy: { created_at: 'desc' },
        take: 100,
      }),

      this.prisma.expenses.findMany({
        where: { businessesId: businessId },
        include: { category: true },
        orderBy: { expense_date: 'desc' },
        take: 100,
      }),

      this.prisma.products.findMany({
        where: { business_id: businessId },
        include: {
          inventaires: true,
          fournisseurs: true,
          warehouse_products: { include: { warehouses: true } },
        },
      }),

      this.prisma.clients.findMany({
        where: { business_id: businessId },
        include: { quotes: true },
      }),

      this.prisma.fournisseurs.findMany({ where: { business_id: businessId } }),

      this.prisma.quotes.findMany({
        where: { clients: { business_id: businessId } },
        include: { clients: true, quote_details: { include: { products: true } } },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),

      this.prisma.banks.findMany({ where: { business_id: businessId } }),

      this.prisma.taxes.findMany({ where: { business_id: businessId } }),

      this.prisma.employee.findMany({
        where: { businessId: businessId },
        include: { payslips: { orderBy: { createdAt: 'desc' }, take: 3 } },
      }),

      this.prisma.warehouses.findMany({
        where: { business_id: businessId },
        include: { warehouse_products: { include: { products: true } } },
      }),

      this.prisma.mouvements.findMany({
        where: { products: { business_id: businessId } },
        include: { products: true },
        orderBy: { mouvement_date: 'desc' },
        take: 30,
      }),

      this.prisma.purchase_orders.findMany({
        where: { business_id: businessId },
        include: { fournisseurs: true, items: { include: { products: true } } },
        orderBy: { created_at: 'desc' },
        take: 30,
      }),

      this.prisma.purchase_orders_client.findMany({
        where: { clients: { business_id: businessId } },
        include: { clients: true, order_details: { include: { products: true } } },
        orderBy: { created_at: 'desc' },
        take: 30,
      }),

      this.prisma.credit_notes.findMany({
        where: { business_id: businessId },
        include: { clients: true, credit_note_items: { include: { products: true } } },
        orderBy: { created_at: 'desc' },
        take: 20,
      }),

      this.prisma.inventory_sessions.findMany({
        where: { business_id: businessId },
        include: { counts: { include: { products: true } } },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),

      this.prisma.expense_categories.findMany({ where: { business_id: businessId } }),
    ]);

    // ── Computed stats ────────────────────────────────────────────────────
    const paidInvoices    = invoices.filter(i => i.status === 'paid');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'draft');

    const totalRevenue      = paidInvoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const overdueAmount     = overdueInvoices.reduce((s, i) => s + Number(i.total_amount), 0);
    const totalExpenses     = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalBankBalance  = banks.reduce((s, b) => s + Number(b.balance ?? 0), 0);
    const totalPayroll      = employees.reduce((s, e) => s + e.baseSalary, 0);

    const monthlyRevenue = paidInvoices
      .filter(i => new Date(i.created_at ?? '') >= firstDayOfMonth)
      .reduce((s, i) => s + Number(i.total_amount), 0);

    const monthlyExpensesTotal = expenses
      .filter(e => new Date(e.expense_date) >= firstDayOfMonth)
      .reduce((s, e) => s + Number(e.amount), 0);

    const yearlyRevenue = paidInvoices
      .filter(i => new Date(i.created_at ?? '') >= firstDayOfYear)
      .reduce((s, i) => s + Number(i.total_amount), 0);

    const expenseByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category?.name ?? 'Uncategorized';
      expenseByCategory[cat] = (expenseByCategory[cat] ?? 0) + Number(e.amount);
    });

    const lowStockProducts = products.filter(p =>
      p.inventaires.some(inv => inv.quantity_available <= (inv.minimum_quantity ?? 5))
    );

    const clientRevenue: Record<string, number> = {};
    invoices.filter(i => i.status === 'paid').forEach(i => {
      const name = i.quotes?.clients?.name ?? 'Unknown';
      clientRevenue[name] = (clientRevenue[name] ?? 0) + Number(i.total_amount);
    });
    const topClients = Object.entries(clientRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return `
You are a smart AI Financial Advisor integrated into ProjectSPI — a SaaS business management platform for Tunisian SMEs.
You have access to ALL real-time data of this business. Answer ONLY based on this data.
Be precise with numbers. Always use DT (Tunisian Dinar). Respond in the same language as the user (French or English).
Be concise and give actionable advice when relevant.

=== BUSINESS INFO ===
Name: ${business?.name} | Legal: ${business?.legal_name ?? 'N/A'} | Tax ID: ${business?.matricule_fiscale ?? 'N/A'}
Address: ${business?.address ?? 'N/A'}, ${business?.city ?? ''}, ${business?.country ?? ''}
Phone: ${business?.phone ?? 'N/A'} | Email: ${business?.email ?? 'N/A'}

=== BANKS & CASH ===
Total balance: ${totalBankBalance.toFixed(3)} DT
${banks.map(b => `• ${b.bank_name} | ${b.account_number} | Balance: ${Number(b.balance ?? 0).toFixed(3)} DT | IBAN: ${b.iban ?? 'N/A'}`).join('\n')}

=== INVOICES ===
Total: ${invoices.length} | Paid: ${paidInvoices.length} (${totalRevenue.toFixed(3)} DT) | Pending: ${pendingInvoices.length} | Overdue: ${overdueInvoices.length} (${overdueAmount.toFixed(3)} DT at risk)
This month revenue: ${monthlyRevenue.toFixed(3)} DT | This year revenue: ${yearlyRevenue.toFixed(3)} DT
Recent invoices:
${invoices.slice(0, 10).map(i => `• #${i.invoice_number} | ${i.quotes?.clients?.name ?? 'N/A'} | ${i.status} | ${Number(i.total_amount).toFixed(3)} DT | Due: ${i.due_date?.toISOString().split('T')[0]}`).join('\n')}

=== EXPENSES ===
Total: ${totalExpenses.toFixed(3)} DT (${expenses.length} records) | This month: ${monthlyExpensesTotal.toFixed(3)} DT
By category: ${Object.entries(expenseByCategory).map(([k, v]) => `${k}: ${v.toFixed(3)} DT`).join(' | ')}
Recent expenses:
${expenses.slice(0, 10).map(e => `• ${e.label} | ${Number(e.amount).toFixed(3)} DT | ${e.category?.name ?? 'N/A'} | ${e.expense_date.toISOString().split('T')[0]} | ${e.status}`).join('\n')}

=== QUOTES (DEVIS) ===
Total: ${quotes.length} | Draft: ${quotes.filter(q => q.status === 'draft').length} | Sent: ${quotes.filter(q => q.status === 'sent').length} | Accepted: ${quotes.filter(q => q.status === 'accepted').length} | Converted: ${quotes.filter(q => q.status === 'converted').length}
${quotes.slice(0, 8).map(q => `• ${q.quote_id} | ${q.clients?.name ?? 'N/A'} | ${q.status} | ${Number(q.total_amount).toFixed(3)} DT | Expires: ${q.expiration_date.toISOString().split('T')[0]}`).join('\n')}

=== CLIENTS (${clients.length} total) ===
Top 5 by revenue: ${topClients.map(([name, amount]) => `${name}: ${amount.toFixed(3)} DT`).join(' | ')}
${clients.map(c => `• ${c.name} | ${c.email ?? 'N/A'} | ${c.city ?? ''} ${c.country ?? ''} | Quotes: ${c.quotes.length}`).join('\n')}

=== SUPPLIERS / FOURNISSEURS (${suppliers.length} total) ===
${suppliers.map(s => `• ${s.name} | ${s.email ?? 'N/A'} | ${s.city ?? ''} ${s.country ?? ''} | Tax: ${s.tax_number ?? 'N/A'}`).join('\n')}

=== PRODUCTS (${products.length} total — ${products.filter(p => p.is_active).length} active) ===
Low stock alert: ${lowStockProducts.length > 0 ? lowStockProducts.map(p => p.name).join(', ') : 'None'}
${products.map(p => {
  const stock = p.inventaires[0];
  return `• ${p.name} | Price: ${Number(p.unit_price).toFixed(3)} DT | Cost: ${Number(p.cost_price ?? 0).toFixed(3)} DT | Stock: ${stock?.quantity_available ?? 0} (min: ${stock?.minimum_quantity ?? 0}) | Cat: ${p.category ?? 'N/A'} | Supplier: ${p.fournisseurs?.name ?? 'N/A'}`;
}).join('\n')}

=== WAREHOUSES (${warehouses.length}) ===
${warehouses.map(w => `• ${w.name} | ${w.location ?? 'N/A'} | ${w.warehouse_products.length} products`).join('\n')}

=== STOCK MOVEMENTS (last 30) ===
${stockMovements.map(m => `• ${m.type} | ${m.products?.name ?? 'N/A'} | Qty: ${m.quantity} | ${m.mouvement_date.toISOString().split('T')[0]} | ${m.note ?? ''}`).join('\n')}

=== PURCHASE ORDERS - SUPPLIER (${purchaseOrders.length}) ===
${purchaseOrders.map(po => `• ${po.order_number} | ${po.fournisseurs?.name ?? 'N/A'} | ${po.status} | ${Number(po.total_amount).toFixed(3)} DT | ${po.order_date.toISOString().split('T')[0]}`).join('\n')}

=== PURCHASE ORDERS - CLIENT (${purchaseOrdersClient.length}) ===
${purchaseOrdersClient.map(po => `• ${po.order_number} | ${po.clients?.name ?? 'N/A'} | ${po.status} | ${Number(po.total_amount).toFixed(3)} DT`).join('\n')}

=== CREDIT NOTES (${creditNotes.length}) ===
${creditNotes.map(cn => `• ${cn.credit_number} | ${cn.clients?.name ?? 'N/A'} | ${cn.status} | ${Number(cn.total_amount).toFixed(3)} DT | ${cn.reason}`).join('\n')}

=== EMPLOYEES (${employees.length}) ===
Total monthly payroll: ${totalPayroll.toFixed(3)} DT
${employees.map(e => `• ${e.firstName} ${e.lastName} | Salary: ${e.baseSalary.toFixed(3)} DT (${e.salaryType}) | Chef de famille: ${e.isHeadOfFamily} | Enfants: ${e.childrenCount}`).join('\n')}

=== TAXES ===
${taxes.map(t => `• ${t.name} | ${Number(t.rate)}% | Default: ${t.is_default} | ${t.description ?? ''}`).join('\n')}

=== INVENTORY SESSIONS (last 5) ===
${inventorySessions.map(s => `• ${s.name} | ${s.status} | ${s.created_at?.toISOString().split('T')[0]} | ${s.counts.length} counts`).join('\n')}
    `.trim();
  }

  async chat(
    businessId: number,
    messages: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    const context = await this.getBusinessContext(businessId);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.API_TRANS}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: context },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${err}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content ?? 'No response from AI.';
  }
}