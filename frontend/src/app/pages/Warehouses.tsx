import { useEffect, useState } from "react";
import { Plus, Warehouse, MapPin, Package, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { stockService } from "@/app/services/stockService";
import { useBusiness } from "@/app/context/BusinessContext";
import { productsService } from "@/app/services/productsService";

export default function Warehouses() {
  const { toast } = useToast();
  const { activeBusiness } = useBusiness();
  const emptyForm = { name: "", location: "" };
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({ product_id: "", quantity: "" });
  const [products, setProducts] = useState<any[]>([]);

  const fetchWarehouses = async () => {
    try {
      const res = await stockService.getWarehouses();
      setWarehouses(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load warehouses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      await stockService.createWarehouse(form);
      toast({ title: "Success 🎉", description: "Warehouse created" });
      setIsCreateOpen(false);
      setForm(emptyForm);
      fetchWarehouses();
    } catch {
      toast({ title: "Error", description: "Creation failed", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    setFormLoading(true);
    try {
      await stockService.updateWarehouse(selected.id, form);
      toast({ title: "Success ✨", description: "Warehouse updated" });
      setIsEditOpen(false);
      setForm(emptyForm);
      fetchWarehouses();
    } catch {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await stockService.deleteWarehouse(selected.id);
      toast({ title: "Deleted 🗑", description: "Warehouse removed" });
      setIsDeleteOpen(false);
      fetchWarehouses();
    } catch {
      toast({ title: "Error", description: "Deletion failed", variant: "destructive" });
    }
  };

  // ── Ouvre le modal Assign + charge les produits du business ──
  const openAssign = async (w: any) => {
    setSelected(w);
    setAssignForm({ product_id: "", quantity: "" });
    try {
      const res = await productsService.getProducts(activeBusiness!.id);
      setProducts(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    }
    setIsAssignOpen(true);
  };

  const handleAssign = async () => {
    setFormLoading(true);
    try {
      await stockService.assignProduct(selected.id, {
        product_id: Number(assignForm.product_id),
        quantity: Number(assignForm.quantity),
      });
      toast({ title: "Success ✨", description: "Product assigned" });
      setIsAssignOpen(false);
      setAssignForm({ product_id: "", quantity: "" });
      fetchWarehouses();
    } catch {
      toast({ title: "Error", description: "Assignment failed", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = warehouses.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Warehouses</h1>
          <p className="text-muted-foreground mt-1">Manage your storage locations</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Button onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Warehouse
          </Button>
        </div>
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
            <Warehouse className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">No warehouses yet</h2>
            <p className="text-muted-foreground mt-1">Add your first warehouse to get started</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Warehouse
          </Button>
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((w) => (
            <Card key={w.id} className="shadow-sm rounded-xl border border-border hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-2 w-full bg-primary" />
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Warehouse className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{w.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {w.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{w.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4 shrink-0" />
                  <span>{w.warehouse_products?.length ?? 0} product(s)</span>
                </div>

                {/* Products list */}
                {w.warehouse_products?.length > 0 && (
                  <div className="pt-2 border-t border-border space-y-1">
                    {w.warehouse_products.map((wp: any) => (
                      <div key={wp.id} className="flex justify-between text-xs text-muted-foreground">
                        <span>{wp.products?.name}</span>
                        <span className="font-medium text-foreground">{wp.quantity} units</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  {/* ✅ Utilise openAssign au lieu de setIsAssignOpen directement */}
                  <Button variant="outline" size="sm" onClick={() => openAssign(w)}>
                    <Package className="h-3 w-3 mr-1" /> Assign Product
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => { setSelected(w); setForm({ name: w.name, location: w.location || "" }); setIsEditOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setSelected(w); setIsDeleteOpen(true); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setIsEditOpen(false); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit" : "New"} Warehouse</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input placeholder="e.g. Main Warehouse" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Location (optional)</label>
              <Input placeholder="e.g. Tunis, Zone Industrielle" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Cancel</Button>
            <Button onClick={isEditOpen ? handleUpdate : handleCreate} disabled={formLoading}>
              {formLoading ? "Saving..." : isEditOpen ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Assign Product Modal — Select au lieu d'Input ID */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Product to {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Product</label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={assignForm.product_id}
                onChange={e => setAssignForm({ ...assignForm, product_id: e.target.value })}
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
                value={assignForm.quantity}
                onChange={e => setAssignForm({ ...assignForm, quantity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAssign}
              disabled={formLoading || !assignForm.product_id || !assignForm.quantity}
            >
              {formLoading ? "Saving..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete <strong className="text-foreground">{selected?.name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}