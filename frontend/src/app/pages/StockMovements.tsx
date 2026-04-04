import { useEffect, useState } from "react";
import { Plus, ArrowLeftRight, ArrowUpCircle, ArrowDownCircle, RefreshCw, Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { stockService } from "@/app/services/stockService";
import { productsService } from "@/app/services/productsService";
import { useBusiness } from "@/app/context/BusinessContext";

export default function StockMovements() {
  const { toast } = useToast();
  const { activeBusiness } = useBusiness();

  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Listes pour les selects
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const emptyForm = { product_id: "", quantity: "", type: "IN", note: "" };
  const emptyTransfer = { fromWarehouseId: "", toWarehouseId: "", productId: "", quantity: "" };

  const [form, setForm] = useState(emptyForm);
  const [transferForm, setTransferForm] = useState(emptyTransfer);

  const fetchMovements = async () => {
    try {
      const res = await stockService.getMovements();
      setMovements(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load movements", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovements(); }, []);

  // ── Ouvre le modal New Movement + charge les produits ──────────
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

  // ── Ouvre le modal Transfer + charge produits et warehouses ────
  const openTransferModal = async () => {
    setTransferForm(emptyTransfer);
    try {
      const [prodRes, whRes] = await Promise.all([
        productsService.getProducts(activeBusiness!.id),
        stockService.getWarehouses(),
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
      await stockService.createMovement({
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
      await stockService.transferStock({
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

  const filtered = movements.filter(m =>
    m.products?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalIn = movements.filter(m => m.type === "IN").reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter(m => m.type === "OUT").reduce((s, m) => s + m.quantity, 0);

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Stock Movements</h1>
          <p className="text-muted-foreground mt-1">Track all stock in/out movements</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Button variant="outline" onClick={openTransferModal}>
            <ArrowLeftRight className="h-4 w-4 mr-2" /> Transfer
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" /> New Movement
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Total Movements</p>
            <h2 className="text-4xl font-bold mt-2">{movements.length}</h2>
            <p className="text-xs text-slate-400 mt-2">All time</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-700 text-white overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-emerald-100 uppercase tracking-widest">Total IN</p>
            <h2 className="text-4xl font-bold mt-2">{totalIn}</h2>
            <p className="text-xs text-emerald-200 mt-2">Units received</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-rose-500 to-rose-700 text-white overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-rose-100 uppercase tracking-widest">Total OUT</p>
            <h2 className="text-4xl font-bold mt-2">{totalOut}</h2>
            <p className="text-xs text-rose-200 mt-2">Units dispatched</p>
          </CardContent>
        </Card>
      </div>

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
            <h2 className="text-xl font-semibold">No movements yet</h2>
            <p className="text-muted-foreground mt-1">Record your first stock movement</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" /> New Movement
          </Button>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-sm font-medium">{m.products?.name}</td>
                    <td className="p-4">{getTypeBadge(m.type)}</td>
                    <td className="p-4 text-sm font-semibold">{m.quantity}</td>
                    <td className="p-4 text-sm text-muted-foreground">{m.note || "-"}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(m.mouvement_date).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ✅ Create Modal — Select produit */}
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
              <Input
                placeholder="0"
                type="number"
                min="1"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
              />
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
              <Input
                placeholder="e.g. Purchase order #123"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={formLoading || !form.product_id || !form.quantity}
            >
              {formLoading ? "Saving..." : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Transfer Modal — Select warehouses + produit */}
      <Dialog open={isTransferOpen} onOpenChange={(open) => { if (!open) { setIsTransferOpen(false); setTransferForm(emptyTransfer); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transfer Stock</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">From Warehouse</label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={transferForm.fromWarehouseId}
                onChange={e => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
              >
                <option value="">-- Select source warehouse --</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">To Warehouse</label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={transferForm.toWarehouseId}
                onChange={e => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
              >
                <option value="">-- Select destination warehouse --</option>
                {warehouses
                  .filter((w: any) => String(w.id) !== transferForm.fromWarehouseId)
                  .map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Product</label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={transferForm.productId}
                onChange={e => setTransferForm({ ...transferForm, productId: e.target.value })}
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
              <Input
                placeholder="0"
                type="number"
                min="1"
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