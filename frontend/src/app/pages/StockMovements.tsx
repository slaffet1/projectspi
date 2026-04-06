import { useEffect, useState, useMemo } from "react";
import {
  Plus, ArrowLeftRight, ArrowUpCircle, ArrowDownCircle,
  RefreshCw, Search, Filter, Download, ChevronUp, ChevronDown,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { stockService } from "@/app/services/stockService";
import { productsService } from "@/app/services/productsService";
import { useBusiness } from "@/app/context/BusinessContext";

const PAGE_SIZE = 15;

type SortField = "date" | "quantity" | "product";
type SortDir = "asc" | "desc";

export default function StockMovements() {
  const { toast } = useToast();
  const { activeBusiness } = useBusiness();

  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "IN" | "OUT" | "UPDATE">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const emptyForm = { product_id: "", quantity: "", type: "IN", note: "" };
  const emptyTransfer = { fromWarehouseId: "", toWarehouseId: "", productId: "", quantity: "" };
  const [form, setForm] = useState(emptyForm);
  const [transferForm, setTransferForm] = useState(emptyTransfer);

  const fetchMovements = async () => {
    try {
      const res = await stockService.getMovements(activeBusiness!.id);
      setMovements(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load movements", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) fetchMovements();
  }, [activeBusiness?.id]);

  // ── Sort handler ───────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  // ── Filtered + sorted + paginated ─────────────────────────────
  const filtered = useMemo(() => {
    let data = [...movements];

    // Search
    if (search) data = data.filter(m =>
      m.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.note?.toLowerCase().includes(search.toLowerCase())
    );

    // Type filter
    if (typeFilter !== "ALL") data = data.filter(m => m.type === typeFilter);

    // Date filter
    if (dateFrom) data = data.filter(m => new Date(m.mouvement_date) >= new Date(dateFrom));
    if (dateTo) data = data.filter(m => new Date(m.mouvement_date) <= new Date(dateTo));

    // Sort
    data.sort((a, b) => {
      let valA: any, valB: any;
      if (sortField === "date") { valA = new Date(a.mouvement_date); valB = new Date(b.mouvement_date); }
      else if (sortField === "quantity") { valA = a.quantity; valB = b.quantity; }
      else { valA = a.products?.name ?? ""; valB = b.products?.name ?? ""; }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [movements, search, typeFilter, dateFrom, dateTo, sortField, sortDir]);

  // ── KPI sur filtered ──────────────────────────────────────────
  const totalIn = filtered.filter(m => m.type === "IN").reduce((s, m) => s + m.quantity, 0);
  const totalOut = filtered.filter(m => m.type === "OUT").reduce((s, m) => s + m.quantity, 0);

  // ── Pagination ────────────────────────────────────────────────
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on filter change
  useEffect(() => setPage(1), [search, typeFilter, dateFrom, dateTo]);

  // ── Export CSV ────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["Product", "Type", "Quantity", "Note", "Date"];
    const rows = filtered.map(m => [
      m.products?.name ?? "",
      m.type,
      m.quantity,
      m.note ?? "",
      new Date(m.mouvement_date).toLocaleDateString("en-GB"),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movements_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Reset filters ─────────────────────────────────────────────
  const hasFilters = search || typeFilter !== "ALL" || dateFrom || dateTo;
  const resetFilters = () => {
    setSearch(""); setTypeFilter("ALL"); setDateFrom(""); setDateTo("");
  };

  // ── Modals ────────────────────────────────────────────────────
  const openCreateModal = async () => {
    setForm(emptyForm);
    try {
      const res = await productsService.getProducts(activeBusiness!.id);
      setProducts(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    }
    setIsCreateOpen(true);
  };

  const openTransferModal = async () => {
    setTransferForm(emptyTransfer);
    try {
      const [prodRes, whRes] = await Promise.all([
        productsService.getProducts(activeBusiness!.id),
        stockService.getWarehouses(activeBusiness!.id),
      ]);
      setProducts(prodRes.data);
      setWarehouses(whRes.data);
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    }
    setIsTransferOpen(true);
  };

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      await stockService.createMovement(activeBusiness!.id, {
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        type: form.type,
        note: form.note,
      });
      toast({ title: "Success 🎉", description: "Movement recorded" });
      setIsCreateOpen(false);
      setForm(emptyForm);
      fetchMovements();
    } catch {
      toast({ title: "Error", description: "Failed to record movement", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleTransfer = async () => {
    setFormLoading(true);
    try {
      await stockService.transferStock(activeBusiness!.id, {
        fromWarehouseId: Number(transferForm.fromWarehouseId),
        toWarehouseId: Number(transferForm.toWarehouseId),
        productId: Number(transferForm.productId),
        quantity: Number(transferForm.quantity),
      });
      toast({ title: "Success 🎉", description: "Stock transferred" });
      setIsTransferOpen(false);
      setTransferForm(emptyTransfer);
      fetchMovements();
    } catch {
      toast({ title: "Error", description: "Transfer failed", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "IN") return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ArrowUpCircle className="h-3 w-3" /> IN
      </span>
    );
    if (type === "OUT") return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <ArrowDownCircle className="h-3 w-3" /> OUT
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
        <RefreshCw className="h-3 w-3" /> UPDATE
      </span>
    );
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Stock Movements</h1>
          <p className="text-muted-foreground mt-1">Track all stock in/out movements</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" onClick={openTransferModal}>
            <ArrowLeftRight className="h-4 w-4 mr-2" /> Transfer
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" /> New Movement
          </Button>
        </div>
      </div>

      {/* KPI — suivent les filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Filtered Movements</p>
            <h2 className="text-4xl font-bold mt-2">{filtered.length}</h2>
            <p className="text-xs text-slate-400 mt-2">of {movements.length} total</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-emerald-100 uppercase tracking-widest">Total IN</p>
            <h2 className="text-4xl font-bold mt-2">{totalIn}</h2>
            <p className="text-xs text-emerald-200 mt-2">Units received</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-rose-500 to-rose-700 text-white">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-rose-100 uppercase tracking-widest">Total OUT</p>
            <h2 className="text-4xl font-bold mt-2">{totalOut}</h2>
            <p className="text-xs text-rose-200 mt-2">Units dispatched</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters bar */}
      <Card className="rounded-2xl shadow-sm border border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product or note..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type filter */}
            <div className="min-w-[140px]">
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger>
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="IN">IN only</SelectItem>
                  <SelectItem value="OUT">OUT only</SelectItem>
                  <SelectItem value="UPDATE">UPDATE only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date from */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-36 text-sm"
              />
            </div>

            {/* Date to */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-36 text-sm"
              />
            </div>

            {/* Reset */}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                ✕ Reset filters
              </Button>
            )}
          </div>

          {/* Active filters summary */}
          {hasFilters && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> result(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ArrowLeftRight className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">No movements found</h2>
            <p className="text-muted-foreground mt-1">
              {hasFilters ? "Try adjusting your filters" : "Record your first stock movement"}
            </p>
          </div>
          {!hasFilters && (
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" /> New Movement
            </Button>
          )}
          {hasFilters && (
            <Button variant="outline" onClick={resetFilters}>Reset filters</Button>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  {/* Sortable columns */}
                  <th
                    className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("product")}
                  >
                    <div className="flex items-center gap-1">Product <SortIcon field="product" /></div>
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th
                    className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center gap-1">Quantity <SortIcon field="quantity" /></div>
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note</th>
                  <th
                    className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">Date <SortIcon field="date" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginated.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-sm font-medium">{m.products?.name}</td>
                    <td className="p-4">{getTypeBadge(m.type)}</td>
                    <td className="p-4">
                      <span className={`text-sm font-bold ${
                        m.type === "IN" ? "text-emerald-600" :
                        m.type === "OUT" ? "text-rose-600" :
                        "text-sky-600"
                      }`}>
                        {m.type === "IN" ? "+" : m.type === "OUT" ? "-" : "~"}{m.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{m.note || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(m.mouvement_date).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} — {filtered.length} results
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span key={`dots-${p}`} className="px-2 py-1 text-xs text-muted-foreground">...</span>
                        )}
                        <Button
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      </>
                    ))
                  }
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Stock Movement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Product</label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={form.product_id}
                onChange={e => setForm({ ...form, product_id: e.target.value })}
              >
                <option value="">-- Select a product --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.reference ? `(${p.reference})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Quantity</label>
              <Input type="number" min="1" placeholder="0" value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">IN — Stock Entry</SelectItem>
                  <SelectItem value="OUT">OUT — Stock Exit</SelectItem>
                  <SelectItem value="UPDATE">UPDATE — Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Note (optional)</label>
              <Input placeholder="e.g. Purchase order #123" value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={formLoading || !form.product_id || !form.quantity}>
              {formLoading ? "Saving..." : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={isTransferOpen} onOpenChange={(open) => { if (!open) { setIsTransferOpen(false); setTransferForm(emptyTransfer); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transfer Stock</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">From Warehouse</label>
              <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={transferForm.fromWarehouseId}
                onChange={e => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}>
                <option value="">-- Select source --</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">To Warehouse</label>
              <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={transferForm.toWarehouseId}
                onChange={e => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}>
                <option value="">-- Select destination --</option>
                {warehouses.filter((w: any) => String(w.id) !== transferForm.fromWarehouseId)
                  .map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Product</label>
              <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={transferForm.productId}
                onChange={e => setTransferForm({ ...transferForm, productId: e.target.value })}>
                <option value="">-- Select a product --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} {p.reference ? `(${p.reference})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Quantity</label>
              <Input type="number" min="1" placeholder="0" value={transferForm.quantity}
                onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
            <Button onClick={handleTransfer}
              disabled={formLoading || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.productId || !transferForm.quantity}>
              {formLoading ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}