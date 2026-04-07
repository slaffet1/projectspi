import { useEffect, useState } from "react";
import { Plus, Filter, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
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
import { purchaseOrderclientService } from "../services/purchaseOrdersClient";
import { useBusiness } from "@/app/context/BusinessContext";
import { toast } from "sonner";

const PAGE_SIZE = 3;

export default function PurchaseOrdersClient() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (businessId) fetchOrders();
  }, [businessId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      const res = await purchaseOrderclientService.getAll(businessId!);
      setOrders(res.data || []);
    } catch (err) {
      toast.error("Failed to load purchase orders");
    }
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      draft:     "bg-slate-50 text-slate-600 border border-slate-200 ring-1 ring-slate-100",
      sent:      "bg-sky-50 text-sky-700 border border-sky-200 ring-1 ring-sky-100",
      confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100",
      invoiced:  "bg-violet-50 text-violet-700 border border-violet-200 ring-1 ring-violet-100",
      cancelled: "bg-rose-50 text-rose-700 border border-rose-200 ring-1 ring-rose-100",
    };
    const labels: Record<string, string> = {
      draft:     "Draft",
      sent:      "Sent",
      confirmed: "Confirmed",
      invoiced:  "Invoiced",
      cancelled: "Cancelled",
    };
    const dots: Record<string, string> = {
      draft:     "bg-slate-400",
      sent:      "bg-sky-500",
      confirmed: "bg-emerald-500",
      invoiced:  "bg-violet-500",
      cancelled: "bg-rose-500",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status ?? ""] || "bg-slate-50 text-slate-600 border border-slate-200"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dots[status ?? ""] || "bg-slate-400"}`} />
        {labels[status ?? ""] || "Unknown"}
      </span>
    );
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesSearch =
      o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginated = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalCount     = orders.length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
  const invoicedCount  = orders.filter((o) => o.status === "invoiced").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage all client purchase orders</p>
        </div>
        <Link to="/app/purchase-orders-client/create">
          <Button className="rounded-xl gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> New Order
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Total Orders</p>
                <h2 className="text-4xl font-bold mt-2 tabular-nums">{totalCount}</h2>
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
                <p className="text-xs font-medium text-emerald-100 uppercase tracking-widest">Confirmed</p>
                <h2 className="text-4xl font-bold mt-2 tabular-nums">{confirmedCount}</h2>
                <p className="text-xs text-emerald-200 mt-2">Ready to invoice</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-violet-500 to-violet-700 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-violet-100 uppercase tracking-widest">Invoiced</p>
                <h2 className="text-4xl font-bold mt-2 tabular-nums">{invoicedCount}</h2>
                <p className="text-xs text-violet-200 mt-2">Converted to invoice</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-rose-500 to-rose-700 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-rose-100 uppercase tracking-widest">Cancelled</p>
                <h2 className="text-4xl font-bold mt-2 tabular-nums">{cancelledCount}</h2>
                <p className="text-xs text-rose-200 mt-2">Cancelled orders</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <XCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl shadow-sm border border-border/60">
        <CardContent className="pt-5 pb-5 flex gap-4">
          <SearchInput
            placeholder="Search order or client..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Number</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue Date</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiration Date</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice</th>
                <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginated.map((order, index) => (
                <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 text-sm text-muted-foreground font-mono">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/app/purchase-orders-client/${order.id}`}
                      className="text-primary font-medium text-sm hover:underline underline-offset-4"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="p-4 text-sm font-medium">{order.clients?.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(order.issue_date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {order.expiration_date
                      ? new Date(order.expiration_date).toLocaleDateString("en-GB")
                      : <span className="text-muted-foreground/50">—</span>
                    }
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-semibold tabular-nums">
                      {Number(order.total_amount).toLocaleString("fr-TN")} DT
                    </span>
                  </td>
                  <td className="p-4">{getStatusBadge(order.status)}</td>

                  {/* Invoice number si invoiced */}
                  <td className="p-4">
                    {order.status === "invoiced" && order.invoices?.[0] ? (
                      <Link
                        to={`/app/invoices/${order.invoices[0].id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline underline-offset-4"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {order.invoices[0].invoice_number}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">-</span>
                    )}
                  </td>

                  <td className="p-4">
                    <Link to={`/app/purchase-orders-client/${order.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs px-3 h-8 border-border/70 hover:bg-muted"
                      >
                        Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted-foreground text-sm">
                    No purchase orders found.
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