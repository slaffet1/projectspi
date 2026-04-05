import { useEffect, useState } from "react";
import { Plus, Filter, Check, TrendingUp, Clock, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { SearchInput } from "@/app/components/SearchInput";
import { Link } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { invoiceService } from "@/app/services/invoiceService";
import { useBusiness } from "@/app/context/BusinessContext";
import { toast } from "sonner";

const PAGE_SIZE = 3;

export default function Invoices() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;
  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingIds, setLoadingIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (businessId) fetchInvoices();
  }, [businessId]);
useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, statusFilter]);
  const fetchInvoices = async () => {
    try {
      const res = await invoiceService.getAll(businessId!);
      const data = res.data || [];
      data.sort(
        (a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
      );
      setInvoices(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load invoices");
    }
  };
const markAsLatePaid = async (id: number) => {
  try {
    setLoadingIds((prev) => [...prev, id]);
    await invoiceService.markLatePaid(id, businessId);

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: "paid" } : inv
      )
    );

    toast.success("Invoice marked as late paid!");

    window.location.reload(); 
  } catch (err) {
    toast.error("Failed to mark as late paid");
  } finally {
    setLoadingIds((prev) => prev.filter((i) => i !== id));
  }
};
  const markAsPaid = async (id: number) => {
    try {
      setLoadingIds((prev) => [...prev, id]);
      await invoiceService.markAsPaid(id);
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: "paid" } : inv))
      );
      toast.success("Invoice marked as paid!");
    } catch (err) {
      toast.error("Failed to mark as paid");
    } finally {
      setLoadingIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      paid: "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100",
      draft: "bg-slate-50 text-slate-600 border border-slate-200 ring-1 ring-slate-100",
      sent: "bg-sky-50 text-sky-700 border border-sky-200 ring-1 ring-sky-100",
      unpaid: "bg-rose-50 text-rose-700 border border-rose-200 ring-1 ring-rose-100",
      late_paid: "bg-orange-50 text-orange-700 border border-orange-200 ring-1 ring-orange-100",
    };
    const labels: Record<string, string> = {
      paid: "✓ Paid",
      draft: "Draft",
      sent: "Sent",
      unpaid: "Unpaid",
      late_paid: "⚠ Paid Late",
    };
    const dots: Record<string, string> = {
      paid: "bg-emerald-500",
      draft: "bg-slate-400",
      sent: "bg-sky-500",
      unpaid: "bg-rose-500",
      late_paid: "bg-orange-500",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          styles[status ?? ""] || "bg-slate-50 text-slate-600 border border-slate-200"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dots[status ?? ""] || "bg-slate-400"}`} />
        {labels[status ?? ""] || "Unknown"}
      </span>
    );
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesSearch =
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.quotes?.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredInvoices.length / PAGE_SIZE);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const totalInvoicesCount = filteredInvoices.length;
  const totalPaidAmount = filteredInvoices
    .filter((i) => i.status === "paid" || i.status === "late_paid")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
  const pendingAmount = filteredInvoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const now = new Date();
  const paidThisMonth = invoices.filter((i) => {
    const d = new Date(i.issue_date);
    return (
      i.status === "paid" || i.status === "late_paid" &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  const overdueInvoices = invoices.filter((i) => {
    const due = i.due_date ? new Date(i.due_date) < new Date() : false;
    return due && i.status === "unpaid";
  }).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage all your client invoices
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Total Invoices</p>
                <h2 className="text-4xl font-bold mt-2 tabular-nums">{totalInvoicesCount}</h2>
                <p className="text-xs text-slate-400 mt-2">All periods</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                <FileText className="h-5 w-5 text-slate-200" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-700 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-100 uppercase tracking-widest">Revenue</p>
                <h2 className="text-4xl font-bold mt-2 tabular-nums">{totalPaidAmount.toFixed(0)}<span className="text-lg font-normal ml-1">DT</span></h2>
                <p className="text-xs text-emerald-200 mt-2">Collected invoices</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-700 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-violet-200 uppercase tracking-widest">Paid This Month</p>
                <h2 className="text-4xl font-bold mt-2 tabular-nums">{paidThisMonth}</h2>
                <p className="text-xs text-violet-200 mt-2">Invoices collected this month</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Check className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-rose-500 to-rose-700 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-rose-100 uppercase tracking-widest">Overdue</p>
                <h2 className="text-4xl font-bold mt-2 tabular-nums">{overdueInvoices}</h2>
                <p className="text-xs text-rose-200 mt-2">Past due date</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          </CardContent>
        </Card>
      </div>

      {/* FILTER */}
      <Card className="rounded-2xl shadow-sm border border-border/60">
        <CardContent className="pt-5 pb-5 flex gap-4">
          <SearchInput
            placeholder="Search invoice or client..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-52 flex items-center gap-2 rounded-xl">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="late_paid">Paid Late</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Number</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedInvoices.map((inv, index) => {
                const isLoading = loadingIds.includes(inv.id);
                return (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-sm text-muted-foreground font-mono">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="p-4">
                      <Link
                        to={`/app/invoices/${inv.id}`}
                        className="text-primary font-medium text-sm hover:underline underline-offset-4"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="p-4 text-sm font-medium">{inv.quotes?.clients?.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(inv.issue_date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(inv.due_date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-semibold tabular-nums">
                        {Number(inv.total_amount).toLocaleString("fr-TN")} DT
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(inv.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/app/invoices/${inv.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-xs px-3 h-8 border-border/70 hover:bg-muted"
                          >
                            Details
                          </Button>
                        </Link>
                        {(inv.status === "draft" || inv.status === "sent") && (
                          <Button
                            size="sm"
                            disabled={isLoading}
                            onClick={() => markAsPaid(inv.id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold
                              rounded-lg px-3 h-8 transition-all duration-200
                              ${isLoading
                                ? "bg-emerald-300 text-white cursor-wait"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200 hover:shadow-emerald-300"
                              }`}
                          >
                            {isLoading ? (
                              <>
                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Processing...
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Mark Paid
                              </>
                            )}
                          </Button>
                        )}
                        {inv.status === "unpaid" && (
  <Button
    size="sm"
    disabled={isLoading}
    onClick={() => markAsLatePaid(inv.id)}
    className={`inline-flex items-center gap-1.5 text-xs font-semibold
      rounded-lg px-3 h-8 transition-all duration-200
      ${isLoading
        ? "bg-orange-300 text-white cursor-wait"
        : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200 hover:shadow-orange-300"
      }`}
  >
    {isLoading ? (
      <>
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Processing...
      </>
    ) : (
      <>
        <Clock className="w-3.5 h-3.5" />
        Mark Late Paid
      </>
    )}
  </Button>
)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground text-sm">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 py-4 border-t border-border/50">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={p === currentPage ? "default" : "ghost"}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 p-0 rounded-lg text-xs ${p === currentPage ? "shadow-sm" : "text-muted-foreground"}`}
                >
                  {p}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
