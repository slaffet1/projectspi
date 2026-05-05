import { Test, TestingModule } from '@nestjs/testing';
import { AiAdvisorService } from './ai-advisor.service';
import { PrismaService } from '../prisma/prisma.service';

// ── Helpers ────────────────────────────────────────────────────────────────
const makeInvoice = (overrides: Partial<any> = {}) => ({
  invoice_number: 'INV-001',
  status: 'paid',
  total_amount: 1000,
  due_date: new Date('2025-12-31'),
  created_at: new Date(),
  bank: null,
  quotes: { clients: { name: 'Client A' } },
  ...overrides,
});

const makeExpense = (overrides: Partial<any> = {}) => ({
  label: 'Office Supplies',
  amount: 200,
  expense_date: new Date(),
  status: 'paid',
  category: { name: 'Office' },
  ...overrides,
});

const makeProduct = (overrides: Partial<any> = {}) => ({
  name: 'Product A',
  unit_price: 50,
  cost_price: 20,
  is_active: true,
  category: 'Electronics',
  inventaires: [{ quantity_available: 10, minimum_quantity: 5 }],
  fournisseurs: { name: 'Supplier A' },
  warehouse_products: [],
  ...overrides,
});

const makeEmployee = (overrides: Partial<any> = {}) => ({
  firstName: 'Ali',
  lastName: 'Ben Salah',
  baseSalary: 2000,
  salaryType: 'monthly',
  isHeadOfFamily: true,
  childrenCount: 2,
  payslips: [],
  ...overrides,
});

const makeBusiness = (overrides: Partial<any> = {}) => ({
  id: 1,
  name: 'ProjectSPI Test',
  legal_name: 'ProjectSPI SARL',
  matricule_fiscale: '1234567A',
  address: '10 Rue de la Paix',
  city: 'Tunis',
  country: 'Tunisia',
  phone: '+216 70 000 000',
  email: 'contact@projectspi.tn',
  ...overrides,
});

// ── Mock Prisma ────────────────────────────────────────────────────────────
const mockPrisma = {
  businesses:            { findUnique: jest.fn() },
  invoices:              { findMany: jest.fn() },
  expenses:              { findMany: jest.fn() },
  products:              { findMany: jest.fn() },
  clients:               { findMany: jest.fn() },
  fournisseurs:          { findMany: jest.fn() },
  quotes:                { findMany: jest.fn() },
  banks:                 { findMany: jest.fn() },
  taxes:                 { findMany: jest.fn() },
  employee:              { findMany: jest.fn() },
  warehouses:            { findMany: jest.fn() },
  mouvements:            { findMany: jest.fn() },
  purchase_orders:       { findMany: jest.fn() },
  purchase_orders_client:{ findMany: jest.fn() },
  credit_notes:          { findMany: jest.fn() },
  inventory_sessions:    { findMany: jest.fn() },
  expense_categories:    { findMany: jest.fn() },
};

// ── Default mock values (happy-path baseline) ──────────────────────────────
function seedDefaultMocks() {
  mockPrisma.businesses.findUnique.mockResolvedValue(makeBusiness());
  mockPrisma.invoices.findMany.mockResolvedValue([makeInvoice()]);
  mockPrisma.expenses.findMany.mockResolvedValue([makeExpense()]);
  mockPrisma.products.findMany.mockResolvedValue([makeProduct()]);
  mockPrisma.clients.findMany.mockResolvedValue([
    { name: 'Client A', email: 'a@a.com', city: 'Tunis', country: 'TN', quotes: [] },
  ]);
  mockPrisma.fournisseurs.findMany.mockResolvedValue([
    { name: 'Supplier A', email: 's@s.com', city: 'Sfax', country: 'TN', tax_number: 'TAX123' },
  ]);
  mockPrisma.quotes.findMany.mockResolvedValue([
    {
      quote_id: 'Q-001',
      status: 'sent',
      total_amount: 500,
      expiration_date: new Date('2025-12-31'),
      clients: { name: 'Client A' },
      quote_details: [],
    },
  ]);
  mockPrisma.banks.findMany.mockResolvedValue([
    { bank_name: 'BNA', account_number: '123', balance: 5000, iban: 'TN00123' },
  ]);
  mockPrisma.taxes.findMany.mockResolvedValue([
    { name: 'TVA', rate: 19, is_default: true, description: 'Standard VAT' },
  ]);
  mockPrisma.employee.findMany.mockResolvedValue([makeEmployee()]);
  mockPrisma.warehouses.findMany.mockResolvedValue([
    { name: 'Main Warehouse', location: 'Tunis', warehouse_products: [] },
  ]);
  mockPrisma.mouvements.findMany.mockResolvedValue([
    { type: 'IN', quantity: 10, mouvement_date: new Date(), note: 'Restock', products: { name: 'Product A' } },
  ]);
  mockPrisma.purchase_orders.findMany.mockResolvedValue([
    {
      order_number: 'PO-001',
      status: 'pending',
      total_amount: 3000,
      order_date: new Date(),
      fournisseurs: { name: 'Supplier A' },
      items: [],
    },
  ]);
  mockPrisma.purchase_orders_client.findMany.mockResolvedValue([
    {
      order_number: 'POC-001',
      status: 'confirmed',
      total_amount: 1500,
      clients: { name: 'Client A' },
      order_details: [],
    },
  ]);
  mockPrisma.credit_notes.findMany.mockResolvedValue([
    {
      credit_number: 'CN-001',
      status: 'issued',
      total_amount: 200,
      reason: 'Return',
      clients: { name: 'Client A' },
      credit_note_items: [],
    },
  ]);
  mockPrisma.inventory_sessions.findMany.mockResolvedValue([
    { name: 'Q1 Inventory', status: 'completed', created_at: new Date(), counts: [] },
  ]);
  mockPrisma.expense_categories.findMany.mockResolvedValue([
    { name: 'Office' },
  ]);
}

// ── Mock global fetch ──────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ══════════════════════════════════════════════════════════════════════════
describe('AiAdvisorService', () => {
  let service: AiAdvisorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAdvisorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AiAdvisorService>(AiAdvisorService);

    jest.clearAllMocks();
    seedDefaultMocks();

    // Default happy-path Groq response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'AI response here.' } }],
      }),
    });
  });

  // ── chat: happy path ─────────────────────────────────────────────────────
  describe('chat', () => {
    it('should return the AI message content on success', async () => {
      const result = await service.chat(1, [{ role: 'user', content: 'What is my revenue?' }]);
      expect(result).toBe('AI response here.');
    });

    it('should call the Groq API with correct model and headers', async () => {
      await service.chat(1, [{ role: 'user', content: 'Hello' }]);

      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toContain('Bearer');
    });

    it('should include the user messages in the request body', async () => {
      const messages = [
        { role: 'user' as const, content: 'What are my expenses?' },
        { role: 'assistant' as const, content: 'Your expenses are ...' },
        { role: 'user' as const, content: 'Break it down by category.' },
      ];

      await service.chat(1, messages);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      // system prompt + all user/assistant messages
      expect(body.messages).toHaveLength(messages.length + 1);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages.slice(1)).toEqual(messages);
    });

    it('should use model llama-3.3-70b-versatile', async () => {
      await service.chat(1, [{ role: 'user', content: 'Hi' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('llama-3.3-70b-versatile');
    });

    it('should set max_tokens to 1024', async () => {
      await service.chat(1, [{ role: 'user', content: 'Hi' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.max_tokens).toBe(1024);
    });

    // ── Groq API errors ────────────────────────────────────────────────────
    it('should throw when Groq API returns a non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => 'Unauthorized',
      });

      await expect(
        service.chat(1, [{ role: 'user', content: 'Test' }]),
      ).rejects.toThrow('Groq API error: Unauthorized');
    });

    it('should return fallback string when choices array is empty', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      const result = await service.chat(1, [{ role: 'user', content: 'Test' }]);
      expect(result).toBe('No response from AI.');
    });

    it('should return fallback string when choices[0].message.content is undefined', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: {} }] }),
      });

      const result = await service.chat(1, [{ role: 'user', content: 'Test' }]);
      expect(result).toBe('No response from AI.');
    });

    // ── System prompt / context content ───────────────────────────────────
    it('should embed business name in the system prompt', async () => {
      await service.chat(1, [{ role: 'user', content: 'Hi' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemContent: string = body.messages[0].content;
      expect(systemContent).toContain('ProjectSPI Test');
    });

    it('should include bank balance in the system prompt', async () => {
      await service.chat(1, [{ role: 'user', content: 'Hi' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemContent: string = body.messages[0].content;
      // 5000 DT bank balance
      expect(systemContent).toContain('5000.000');
    });

    it('should include overdue invoice amount in the system prompt', async () => {
      mockPrisma.invoices.findMany.mockResolvedValue([
        makeInvoice({ status: 'overdue', total_amount: 750 }),
      ]);

      await service.chat(1, [{ role: 'user', content: 'Hi' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemContent: string = body.messages[0].content;
      expect(systemContent).toContain('750.000');
    });

    it('should mention low-stock products in the system prompt', async () => {
      mockPrisma.products.findMany.mockResolvedValue([
        makeProduct({
          name: 'Low Stock Item',
          inventaires: [{ quantity_available: 1, minimum_quantity: 10 }],
        }),
      ]);

      await service.chat(1, [{ role: 'user', content: 'Hi' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemContent: string = body.messages[0].content;
      expect(systemContent).toContain('Low Stock Item');
    });

    it('should report "None" for low stock when all products have sufficient stock', async () => {
      mockPrisma.products.findMany.mockResolvedValue([
        makeProduct({
          inventaires: [{ quantity_available: 100, minimum_quantity: 5 }],
        }),
      ]);

      await service.chat(1, [{ role: 'user', content: 'Hi' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemContent: string = body.messages[0].content;
      expect(systemContent).toContain('None');
    });

    it('should show total payroll as sum of all employee base salaries', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([
        makeEmployee({ baseSalary: 1500 }),
        makeEmployee({ baseSalary: 2500 }),
      ]);

      await service.chat(1, [{ role: 'user', content: 'Hi' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemContent: string = body.messages[0].content;
      // 1500 + 2500 = 4000
      expect(systemContent).toContain('4000.000');
    });

    it('should aggregate expenses by category', async () => {
      mockPrisma.expenses.findMany.mockResolvedValue([
        makeExpense({ amount: 100, category: { name: 'Office' } }),
        makeExpense({ amount: 200, category: { name: 'Office' } }),
        makeExpense({ amount: 50,  category: { name: 'Transport' } }),
      ]);

      await service.chat(1, [{ role: 'user', content: 'Hi' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemContent: string = body.messages[0].content;
      // Office total = 300
      expect(systemContent).toContain('Office: 300.000');
      expect(systemContent).toContain('Transport: 50.000');
    });

    it('should calculate correct total revenue from paid invoices only', async () => {
      mockPrisma.invoices.findMany.mockResolvedValue([
        makeInvoice({ status: 'paid',    total_amount: 1000 }),
        makeInvoice({ status: 'pending', total_amount: 9999 }), // must NOT count
        makeInvoice({ status: 'overdue', total_amount: 9999 }), // must NOT count
      ]);

      await service.chat(1, [{ role: 'user', content: 'revenue?' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemContent: string = body.messages[0].content;
      // Only 1000 DT should appear as paid total
      expect(systemContent).toContain('Paid: 1 (1000.000 DT)');
    });

    // ── Prisma calls ───────────────────────────────────────────────────────
    it('should query prisma with the correct businessId', async () => {
      await service.chat(42, [{ role: 'user', content: 'Hi' }]);

      expect(mockPrisma.businesses.findUnique).toHaveBeenCalledWith({ where: { id: 42 } });
      expect(mockPrisma.invoices.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { quotes: { clients: { business_id: 42 } } },
        }),
      );
      expect(mockPrisma.expenses.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { businessesId: 42 } }),
      );
      expect(mockPrisma.banks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { business_id: 42 } }),
      );
    });

    it('should query all 17 Prisma models in a single chat call', async () => {
      await service.chat(1, [{ role: 'user', content: 'summary' }]);

      expect(mockPrisma.businesses.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.invoices.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.expenses.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.products.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.clients.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.fournisseurs.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.quotes.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.banks.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.taxes.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.employee.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.warehouses.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.mouvements.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.purchase_orders.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.purchase_orders_client.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.credit_notes.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.inventory_sessions.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.expense_categories.findMany).toHaveBeenCalledTimes(1);
    });

    // ── Edge cases ─────────────────────────────────────────────────────────
    it('should handle a business with no data gracefully (empty arrays)', async () => {
      mockPrisma.businesses.findUnique.mockResolvedValue(makeBusiness());
      mockPrisma.invoices.findMany.mockResolvedValue([]);
      mockPrisma.expenses.findMany.mockResolvedValue([]);
      mockPrisma.products.findMany.mockResolvedValue([]);
      mockPrisma.clients.findMany.mockResolvedValue([]);
      mockPrisma.fournisseurs.findMany.mockResolvedValue([]);
      mockPrisma.quotes.findMany.mockResolvedValue([]);
      mockPrisma.banks.findMany.mockResolvedValue([]);
      mockPrisma.taxes.findMany.mockResolvedValue([]);
      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.warehouses.findMany.mockResolvedValue([]);
      mockPrisma.mouvements.findMany.mockResolvedValue([]);
      mockPrisma.purchase_orders.findMany.mockResolvedValue([]);
      mockPrisma.purchase_orders_client.findMany.mockResolvedValue([]);
      mockPrisma.credit_notes.findMany.mockResolvedValue([]);
      mockPrisma.inventory_sessions.findMany.mockResolvedValue([]);
      mockPrisma.expense_categories.findMany.mockResolvedValue([]);

      const result = await service.chat(1, [{ role: 'user', content: 'Any data?' }]);
      expect(result).toBe('AI response here.');
    });

    it('should handle null business info without throwing', async () => {
      mockPrisma.businesses.findUnique.mockResolvedValue(null);

      await expect(
        service.chat(999, [{ role: 'user', content: 'Who am I?' }]),
      ).resolves.toBe('AI response here.');
    });

    it('should handle expenses with no category (Uncategorized)', async () => {
      mockPrisma.expenses.findMany.mockResolvedValue([
        makeExpense({ amount: 300, category: null }),
      ]);

      await service.chat(1, [{ role: 'user', content: 'Hi' }]);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemContent: string = body.messages[0].content;
      expect(systemContent).toContain('Uncategorized: 300.000');
    });

    it('should handle invoices with null client name gracefully', async () => {
      mockPrisma.invoices.findMany.mockResolvedValue([
        makeInvoice({ status: 'paid', quotes: null }),
      ]);

      await expect(
        service.chat(1, [{ role: 'user', content: 'Hi' }]),
      ).resolves.toBe('AI response here.');
    });

    it('should support an empty messages array', async () => {
      const result = await service.chat(1, []);
      expect(result).toBe('AI response here.');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Only the system message
      expect(body.messages).toHaveLength(1);
    });
  });
});