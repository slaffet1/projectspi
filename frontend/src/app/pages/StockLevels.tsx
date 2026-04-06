import { useEffect, useState } from "react";
import { BarChart3, Search, AlertTriangle, Package } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { stockService } from "@/app/services/stockService";
import { useBusiness } from "@/app/context/BusinessContext";

export default function StockLevels() {
  const { toast } = useToast();
  const { activeBusiness } = useBusiness();
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLevels = async () => {
    try {
      const res = await stockService.getStockLevels(activeBusiness!.id);
      setLevels(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load stock levels", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) fetchLevels();
  }, [activeBusiness?.id]);

  const filtered = levels.filter(l =>
    l.products?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = levels.length;
  const lowStock = levels.filter(l => l.quantity_available <= (l.minimum_quantity ?? 0)).length;
  const outOfStock = levels.filter(l => l.quantity_available === 0).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Stock Levels</h1>
          <p className="text-muted-foreground mt-1">Monitor your current inventory</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Total Products</p>
                <h2 className="text-4xl font-bold mt-2">{totalProducts}</h2>
                <p className="text-xs text-slate-400 mt-2">In inventory</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10">
                <Package className="h-5 w-5 text-slate-200" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-amber-500 to-amber-700 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-amber-100 uppercase tracking-widest">Low Stock</p>
                <h2 className="text-4xl font-bold mt-2">{lowStock}</h2>
                <p className="text-xs text-amber-200 mt-2">Below minimum</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-rose-500 to-rose-700 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-rose-100 uppercase tracking-widest">Out of Stock</p>
                <h2 className="text-4xl font-bold mt-2">{outOfStock}</h2>
                <p className="text-xs text-rose-200 mt-2">Zero quantity</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/20">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
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
            <BarChart3 className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">No stock data yet</h2>
            <p className="text-muted-foreground mt-1">Add stock movements to see levels here</p>
          </div>
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
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Minimum</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((level) => {
                  const isLow = level.quantity_available <= (level.minimum_quantity ?? 0);
                  const isOut = level.quantity_available === 0;
                  return (
                    <tr key={level.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 text-sm font-medium">{level.products?.name}</td>
                      <td className="p-4 text-sm text-muted-foreground">{level.products?.category || "-"}</td>
                      <td className="p-4">
                        <span className={`text-sm font-semibold ${isOut ? "text-destructive" : isLow ? "text-amber-600" : "text-foreground"}`}>
                          {level.quantity_available}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{level.minimum_quantity ?? 0}</td>
                      <td className="p-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {level.last_updated ? new Date(level.last_updated).toLocaleDateString("en-GB") : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}