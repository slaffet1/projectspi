import { InvoiceStatus } from "@/app/components/StatusBadge";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalInvoiced: number;
  totalUnpaid: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  attachments?: string[];
}

export const mockClients: Client[] = [
  {
    id: "1",
    name: "Tech Solutions SARL",
    email: "contact@techsolutions.tn",
    phone: "+216 71 123 456",
    address: "Avenue Habib Bourguiba, Tunis",
    totalInvoiced: 45600,
    totalUnpaid: 12000,
  },
  {
    id: "2",
    name: "Commerce Plus",
    email: "info@commerceplus.tn",
    phone: "+216 73 987 654",
    address: "Route de Sfax, Sousse",
    totalInvoiced: 32400,
    totalUnpaid: 0,
  },
  {
    id: "3",
    name: "Digital Agency",
    email: "hello@digitalagency.tn",
    phone: "+216 98 765 432",
    address: "Rue de la Liberté, La Marsa",
    totalInvoiced: 28900,
    totalUnpaid: 8500,
  },
  {
    id: "4",
    name: "Startup Innovation",
    email: "contact@startup.tn",
    phone: "+216 22 456 789",
    address: "Lac 2, Tunis",
    totalInvoiced: 15200,
    totalUnpaid: 5200,
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: "1",
    number: "INV-2026-001",
    clientId: "1",
    clientName: "Tech Solutions SARL",
    date: "2026-01-15",
    dueDate: "2026-02-14",
    amount: 12000,
    status: "overdue",
    items: [
      {
        id: "1",
        description: "Développement site web",
        quantity: 1,
        unitPrice: 10000,
        taxRate: 19,
      },
      {
        id: "2",
        description: "Hébergement annuel",
        quantity: 1,
        unitPrice: 1200,
        taxRate: 19,
      },
    ],
  },
  {
    id: "2",
    number: "INV-2026-002",
    clientId: "2",
    clientName: "Commerce Plus",
    date: "2026-01-20",
    dueDate: "2026-02-19",
    amount: 8500,
    status: "paid",
    items: [
      {
        id: "1",
        description: "Système de gestion des stocks",
        quantity: 1,
        unitPrice: 7142.86,
        taxRate: 19,
      },
    ],
  },
  {
    id: "3",
    number: "INV-2026-003",
    clientId: "3",
    clientName: "Digital Agency",
    date: "2026-01-25",
    dueDate: "2026-02-24",
    amount: 6700,
    status: "pending",
    items: [
      {
        id: "1",
        description: "Design graphique",
        quantity: 5,
        unitPrice: 1126.05,
        taxRate: 19,
      },
    ],
  },
  {
    id: "4",
    number: "INV-2026-004",
    clientId: "4",
    clientName: "Startup Innovation",
    date: "2026-02-01",
    dueDate: "2026-03-03",
    amount: 5200,
    status: "pending",
    items: [
      {
        id: "1",
        description: "Consultation stratégique",
        quantity: 4,
        unitPrice: 1092.44,
        taxRate: 19,
      },
    ],
  },
  {
    id: "5",
    number: "INV-2026-005",
    clientId: "1",
    clientName: "Tech Solutions SARL",
    date: "2026-02-03",
    dueDate: "2026-03-05",
    amount: 3400,
    status: "draft",
    items: [
      {
        id: "1",
        description: "Maintenance mensuelle",
        quantity: 1,
        unitPrice: 2857.14,
        taxRate: 19,
      },
    ],
  },
];

export const mockExpenses: Expense[] = [
  {
    id: "1",
    description: "Abonnement Adobe Creative Cloud",
    amount: 52.99,
    category: "Logiciels",
    date: "2026-01-05",
  },
  {
    id: "2",
    description: "Hébergement serveur - DigitalOcean",
    amount: 120,
    category: "Infrastructure",
    date: "2026-01-10",
  },
  {
    id: "3",
    description: "Facture électricité bureau",
    amount: 245,
    category: "Bureautique",
    date: "2026-01-15",
  },
  {
    id: "4",
    description: "Déplacement client - Essence",
    amount: 65,
    category: "Transport",
    date: "2026-01-22",
  },
  {
    id: "5",
    description: "Matériel informatique - Souris et clavier",
    amount: 89,
    category: "Matériel",
    date: "2026-01-28",
  },
  {
    id: "6",
    description: "Repas d'affaires avec client",
    amount: 145,
    category: "Restaurant",
    date: "2026-02-02",
  },
];

export const expenseCategories = [
  { value: "logiciels", label: "Logiciels", icon: "💻", color: "#2563EB" },
  { value: "infrastructure", label: "Infrastructure", icon: "☁️", color: "#60A5FA" },
  { value: "bureautique", label: "Bureautique", icon: "🏢", color: "#1E3A8A" },
  { value: "transport", label: "Transport", icon: "🚗", color: "#10B981" },
  { value: "materiel", label: "Matériel", icon: "🖥️", color: "#F59E0B" },
  { value: "restaurant", label: "Restaurant", icon: "🍽️", color: "#EF4444" },
];

// Données pour les graphiques
export const revenueExpenseData = [
  { month: "Sep", revenus: 18500, depenses: 8200 },
  { month: "Oct", revenus: 22400, depenses: 9100 },
  { month: "Nov", revenus: 19800, depenses: 7800 },
  { month: "Déc", revenus: 25600, depenses: 10200 },
  { month: "Jan", revenus: 28400, depenses: 9500 },
  { month: "Fév", revenus: 32100, depenses: 11200 },
];

export const expenseCategoryData = [
  { name: "Logiciels", value: 212, fill: "#2563EB" },
  { name: "Infrastructure", value: 360, fill: "#60A5FA" },
  { name: "Bureautique", value: 490, fill: "#1E3A8A" },
  { name: "Transport", value: 195, fill: "#10B981" },
  { name: "Matériel", value: 178, fill: "#F59E0B" },
  { name: "Restaurant", value: 290, fill: "#EF4444" },
];
