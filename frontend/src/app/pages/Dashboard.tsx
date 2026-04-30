import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle,
  Building2, Package, FileText, Loader2, ArrowUpRight,
  ArrowDownRight, BarChart3, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { StatusBadge, InvoiceStatus } from "@/app/components/StatusBadge";
import { Button } from "@/app/components/ui/button";
import {
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { Link, useNavigate } from "react-router";
import { useBusiness } from "@/app/context/BusinessContext";
import { invoiceService } from "@/app/services/invoiceService";
import { expenseService } from "@/app/services/expenseService";
import { stockService } from "@/app/services/stockService";

// ── Types ────────────────────────────────────────────────────────────────────
interface Invoice {
  id: number;
  invoice_number?: string;
  number?: string;
  client_name?: string;
  clientName?: string;
  due_date?: string;
  dueDate?: string;
  total_amount?: number;
  amount?: number;
  status: string;
  created_at?: string;
}

interface Expense {
  id: number;
  amount: number;
  category?: string;
  date?: string;
  created_at?: string;
}

interface StockLevel {
  product_name: string;
  quantity: number;
  min_quantity?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PIE_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

function buildRevenueExpenseData(invoices: Invoice[], expenses: Expense[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { monthIndex: d.getMonth(), year: d.getFullYear(), label: MONTH_LABELS[d.getMonth()] };
  });

  return months.map(({ monthIndex, year, label }) => {
    const Revenue = invoices
      .filter(inv => inv.status === "paid" || inv.status === "payée")
      .filter(inv => {
        const d = new Date(inv.created_at ?? inv.due_date ?? "");
        return d.getMonth() === monthIndex && d.getFullYear() === year;
      })
      .reduce((s, inv) => s + Number(inv.total_amount ?? inv.amount ?? 0), 0);

    const Expenses = expenses
      .filter(exp => {
        const d = new Date(exp.date ?? exp.created_at ?? "");
        return d.getMonth() === monthIndex && d.getFullYear() === year;
      })
      .reduce((s, exp) => s + Number(exp.amount ?? 0), 0);

    return { month: label, Revenue, Expenses };
  });
}

function buildExpenseCategoryData(expenses: Expense[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const map: Record<string, number> = {};
  expenses
    .filter(exp => {
      const d = new Date(exp.date ?? exp.created_at ?? "");
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .forEach(exp => {
      const cat = exp.category ?? "Other";
      map[cat] = (map[cat] ?? 0) + Number(exp.amount ?? 0);
    });

  return Object.entries(map).map(([name, value], i) => ({
    name, value, fill: PIE_COLORS[i % PIE_COLORS.length],
  }));
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{Number(p.value).toLocaleString("fr-TN")} DT</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { activeBusiness, activeRole } = useBusiness();
  const navigate = useNavigate();
  const businessId = activeBusiness?.id;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [invRes, expRes, stockRes] = await Promise.allSettled([
        invoiceService.getAll(businessId!),
        expenseService.getAll(businessId!),
        stockService.getStockLevels(businessId!),
      ]);
      if (invRes.status === "fulfilled") {
        const data = invRes.value?.data;
        setInvoices(Array.isArray(data) ? data : data?.data ?? []);
      }
      if (expRes.status === "fulfilled") {
        const data = expRes.value?.data;
        setExpenses(Array.isArray(data) ? data : data?.data ?? []);
      }
      if (stockRes.status === "fulfilled") {
        const data = stockRes.value?.data;
        setStockLevels(Array.isArray(data) ? data : data?.data ?? []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!businessId) { setLoading(false); return; }
    fetchAll();
  }, [businessId]);

  // ── Computed KPIs ──────────────────────────────────────────────────────────
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const paidInvoices    = invoices.filter(inv => inv.status === "paid"    || inv.status === "payée");
  const overdueInvoices = invoices.filter(inv => inv.status === "overdue" || inv.status === "en_retard");
  const pendingInvoices = invoices.filter(inv => inv.status === "pending" || inv.status === "en_attente");

  const totalRevenue = paidInvoices.reduce((s, inv) => s + Number(inv.total_amount ?? inv.amount ?? 0), 0);

  const monthlyExpenses = expenses
    .filter(exp => {
      const d = new Date(exp.date ?? exp.created_at ?? "");
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((s, exp) => s + Number(exp.amount ?? 0), 0);

  const profit = totalRevenue - monthlyExpenses;

  const lowStockItems = stockLevels.filter(s =>
    s.min_quantity !== undefined ? s.quantity <= s.min_quantity : s.quantity <= 5
  );

  const revenueExpenseData = buildRevenueExpenseData(invoices, expenses);
  const expenseCategoryData = buildExpenseCategoryData(expenses);

  // ── No active business ─────────────────────────────────────────────────────
  if (!activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Building2 className="h-10 w-10 text-blue-500" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Welcome!</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Start by creating or selecting a business to access your dashboard.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/app/businesses/new')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Create a business
          </button>
          <button
            onClick={() => navigate('/app/businesses')}
            className="px-5 py-2.5 border rounded-lg font-medium hover:bg-gray-50 transition"
          >
            My businesses
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Financial overview — {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="rounded-xl"
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <div
            onClick={() => navigate('/app/businesses')}
            className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 cursor-pointer hover:bg-blue-100 transition"
          >
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{activeBusiness.name?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-xs text-blue-500 font-medium leading-none">Active workspace</p>
              <p className="text-sm font-semibold text-blue-900">{activeBusiness.name}</p>
            </div>
            {activeRole && (
              <span className="text-xs bg-white border border-blue-200 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                {activeRole}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
          <Package className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{lowStockItems.length} product(s)</span> running low:{" "}
            {lowStockItems.slice(0, 3).map(s => s.product_name).join(", ")}
            {lowStockItems.length > 3 && ` +${lowStockItems.length - 3} more`}
          </p>
          <Link to="/app/stock/levels" className="ml-auto shrink-0">
            <Button variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-100 rounded-lg text-xs">
              View stock
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3" />{paidInvoices.length} paid
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">{totalRevenue.toLocaleString("fr-TN")} <span className="text-sm font-normal text-muted-foreground">DT</span></p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <ArrowDownRight className="h-3 w-3" />{expenses.length} entries
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Monthly Expenses</p>
            <p className="text-2xl font-bold mt-1">{monthlyExpenses.toLocaleString("fr-TN")} <span className="text-sm font-normal text-muted-foreground">DT</span></p>
          </CardContent>
        </Card>

        <Card className={`border-border shadow-sm hover:shadow-md transition-shadow ${profit < 0 ? "border-l-4 border-l-red-400" : "border-l-4 border-l-green-400"}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${profit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                <TrendingUp className={`h-5 w-5 ${profit >= 0 ? "text-green-600" : "text-red-500"}`} />
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${profit >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                {profit >= 0 ? "Profit" : "Deficit"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>
              {profit.toLocaleString("fr-TN")} <span className="text-sm font-normal text-muted-foreground">DT</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
              {overdueInvoices.length > 0 && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {overdueInvoices.length} overdue
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Pending Invoices</p>
            <p className="text-2xl font-bold mt-1">{pendingInvoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Revenue vs Expenses</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Last 6 months overview</p>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {revenueExpenseData.every(d => d.Revenue === 0 && d.Expenses === 0) ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground gap-2">
                <BarChart3 className="h-10 w-10 text-gray-200" />
                <span className="text-sm">No data available yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueExpenseData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: "12px" }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#2563EB" strokeWidth={2} fill="url(#colorRevenue)" dot={{ fill: "#2563EB", r: 3 }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={2} fill="url(#colorExpenses)" dot={{ fill: "#EF4444", r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Expenses by Category</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Current month breakdown</p>
          </CardHeader>
          <CardContent>
            {expenseCategoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground gap-2">
                <Package className="h-10 w-10 text-gray-200" />
                <span className="text-sm">No expenses this month</span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {expenseCategoryData.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                        <span className="text-muted-foreground truncate max-w-[100px]">{entry.name}</span>
                      </div>
                      <span className="font-medium">{Number(entry.value).toLocaleString("fr-TN")} DT</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue invoices */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Overdue Invoices
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {overdueInvoices.length === 0
                ? "All invoices are up to date"
                : `${overdueInvoices.length} invoice(s) require your attention`}
            </p>
          </div>
          <Link to="/app/invoices">
            <Button variant="outline" size="sm" className="rounded-xl">View all invoices</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {overdueInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <span className="text-sm font-medium text-green-600">All clear — no overdue invoices</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Number</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{invoice.invoice_number ?? invoice.number ?? `#${invoice.id}`}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{invoice.client_name ?? invoice.clientName ?? "—"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {(invoice.due_date ?? invoice.dueDate)
                          ? new Date(invoice.due_date ?? invoice.dueDate!).toLocaleDateString("en-GB")
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold">
                        {Number(invoice.total_amount ?? invoice.amount ?? 0).toLocaleString("fr-TN")} DT
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={invoice.status as InvoiceStatus} />
                      </td>
                      <td className="py-3 px-4">
                        <Link to="/app/invoices">
                          <Button variant="ghost" size="sm" className="text-primary rounded-lg text-xs">Follow up</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </div>
            <Link to="/app/invoices" className="ml-auto">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </div>
            <Link to="/app/expenses" className="ml-auto">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className={`text-2xl font-bold ${lowStockItems.length > 0 ? "text-amber-600" : ""}`}>
                {lowStockItems.length}
              </p>
            </div>
            <Link to="/app/stock/levels" className="ml-auto">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
