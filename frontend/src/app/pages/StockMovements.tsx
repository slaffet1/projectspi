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

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" aria-hidden="true" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-primary" aria-hidden="true" />
      : <ChevronDown className="h-3 w-3 text-primary" aria-hidden="true" />;
  };

  const filtered = useMemo(() => {
    let data = [...movements];
    if (search) data = data.filter(m =>
      m.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.note?.toLowerCase().includes(search.toLowerCase())
    );
    if (typeFilter !== "ALL") data = data.filter(m => m.type === typeFilter);
    if (dateFrom) data = data.filter(m => new Date(m.mouvement_date) >= new Date(dateFrom));
    if (dateTo) data = data.filter(m => new Date(m.mouvement_date) <= new Date(dateTo));
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

  const totalIn = filtered.filter(m => m.type === "IN").reduce((s, m) => s + m.quantity, 0);
  const totalOut = filtered.filter(m => m.type === "OUT").reduce((s, m) => s + m.quantity, 0);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, typeFilter, dateFrom, dateTo]);

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

  const hasFilters = search || typeFilter !== "ALL" || dateFrom || dateTo;
  const resetFilters = () => {
    setSearch(""); setTypeFilter("ALL"); setDateFrom(""); setDateTo("");
  };

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
      toast({ title: "Success", description: "Movement recorded" });
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
      toast({ title: "Success", description: "Stock transferred" });
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
        <ArrowUpCircle className="h-3 w-3" aria-hidden="true" /> IN
      </span>
    );
    if (type === "OUT") return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
        <ArrowDownCircle className="h-3 w-3" aria-hidden="true" /> OUT
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
        <RefreshCw className="h-3 w-3" aria-hidden="true" /> UPDATE
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
            <Download className="h-4 w-4 mr-2" aria-hidden="true" /> Export CSV
          </Button>
          <Button variant="outline" onClick={openTransferModal}>
            <ArrowLeftRight className="h-4 w-4 mr-2" aria-hidden="true" /> Transfer
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> New Movement
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label="Movement statistics">
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
          <div className="flex flex-wrap gap-3 items-end" role="search" aria-label="Filter movements">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <label htmlFor="movement-search" className="sr-only">Search product or note</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="movement-search"
                type="search"
                placeholder="Search product or note..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type filter */}
            <div className="min-w-[140px]">
              <label htmlFor="type-filter" className="sr-only">Filter by type</label>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger id="type-filter">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" aria-hidden="true" />
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
              <label htmlFor="date-from" className="text-xs text-muted-foreground font-medium">From</label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-36 text-sm"
              />
            </div>

            {/* Date to */}
            <div className="flex flex-col gap-1">
              <label htmlFor="date-to" className="text-xs text-muted-foreground font-medium">To</label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-36 text-sm"
              />
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                Reset filters
              </Button>
            )}
          </div>

          {hasFilters && (
            <p className="text-xs text-muted-foreground mt-2" aria-live="polite">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> result(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16" role="status" aria-label="Loading stock movements">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
            <ArrowLeftRight className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">No movements found</h2>
            <p className="text-muted-foreground mt-1">
              {hasFilters ? "Try adjusting your filters" : "Record your first stock movement"}
            </p>
          </div>
          {!hasFilters && (
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> New Movement
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
            <table className="w-full" aria-label="Stock movements">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th
                    scope="col"
                    className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("product")}
                    aria-sort={sortField === "product" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <div className="flex items-center gap-1">Product <SortIcon field="product" /></div>
                  </th>
                  <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th
                    scope="col"
                    className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("quantity")}
                    aria-sort={sortField === "quantity" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <div className="flex items-center gap-1">Quantity <SortIcon field="quantity" /></div>
                  </th>
                  <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note</th>
                  <th
                    scope="col"
                    className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("date")}
                    aria-sort={sortField === "date" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
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
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  Page {page} of {totalPages} — {filtered.length} results
                </p>
                <nav aria-label="Pagination">
                  <div className="flex gap-1">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Previous page"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => (
                        <>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span key={`dots-${p}`} className="px-2 py-1 text-xs text-muted-foreground" aria-hidden="true">...</span>
                          )}
                          <Button
                            key={p}
                            variant={p === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(p)}
                            aria-label={`Page ${p}`}
                            aria-current={p === page ? "page" : undefined}
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
                      aria-label="Next page"
                    >
                      Next
                    </Button>
                  </div>
                </nav>
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
              <label htmlFor="movement-product" className="text-sm font-medium mb-1 block">Product</label>
              <select
                id="movement-product"
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
              <label htmlFor="movement-quantity" className="text-sm font-medium mb-1 block">Quantity</label>
              <Input
                id="movement-quantity"
                type="number" min="1" placeholder="0"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="movement-type" className="text-sm font-medium mb-1 block">Type</label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger id="movement-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">IN — Stock Entry</SelectItem>
                  <SelectItem value="OUT">OUT — Stock Exit</SelectItem>
                  <SelectItem value="UPDATE">UPDATE — Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="movement-note" className="text-sm font-medium mb-1 block">Note (optional)</label>
              <Input
                id="movement-note"
                placeholder="e.g. Purchase order #123"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
              />
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
              <label htmlFor="transfer-from" className="text-sm font-medium mb-1 block">From Warehouse</label>
              <select
                id="transfer-from"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={transferForm.fromWarehouseId}
                onChange={e => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
              >
                <option value="">-- Select source --</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="transfer-to" className="text-sm font-medium mb-1 block">To Warehouse</label>
              <select
                id="transfer-to"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={transferForm.toWarehouseId}
                onChange={e => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
              >
                <option value="">-- Select destination --</option>
                {warehouses.filter((w: any) => String(w.id) !== transferForm.fromWarehouseId)
                  .map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="transfer-product" className="text-sm font-medium mb-1 block">Product</label>
              <select
                id="transfer-product"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={transferForm.productId}
                onChange={e => setTransferForm({ ...transferForm, productId: e.target.value })}
              >
                <option value="">-- Select a product --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} {p.reference ? `(${p.reference})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="transfer-quantity" className="text-sm font-medium mb-1 block">Quantity</label>
              <Input
                id="transfer-quantity"
                type="number" min="1" placeholder="0"
                value={transferForm.quantity}
                onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
            <Button
              onClick={handleTransfer}
              disabled={formLoading || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.productId || !transferForm.quantity}
            >
              {formLoading ? "Transferring..." : "Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}