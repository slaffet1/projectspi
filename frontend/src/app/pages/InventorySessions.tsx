import { useEffect, useState } from "react";
import { Plus, ClipboardCheck, Search, ChevronDown, ChevronRight, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { stockService } from "@/app/services/stockService";
import { productsService } from "@/app/services/productsService";
import { useBusiness } from "@/app/context/BusinessContext";

export default function InventorySessions() {
  const { toast } = useToast();
  const { activeBusiness } = useBusiness();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCountOpen, setIsCountOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [report, setReport] = useState<any[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [countForm, setCountForm] = useState({ product_id: "", physical_quantity: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const fetchSessions = async () => {
    try {
      const res = await stockService.getSessions(activeBusiness!.id);
      setSessions(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load sessions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) fetchSessions();
  }, [activeBusiness?.id]);

  const openCountModal = async (session: any) => {
    setSelected(session);
    setCountForm({ product_id: "", physical_quantity: "" });
    try {
      const res = await productsService.getProducts(activeBusiness!.id);
      setProducts(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    }
    setIsCountOpen(true);
  };

  const handleCreate = async () => {
    if (!sessionName) return;
    setFormLoading(true);
    try {
      await stockService.createSession(activeBusiness!.id, sessionName);
      toast({ title: "Success", description: "Inventory session created" });
      setIsCreateOpen(false);
      setSessionName("");
      fetchSessions();
    } catch {
      toast({ title: "Error", description: "Creation failed", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleRecordCount = async () => {
    setFormLoading(true);
    try {
      await stockService.recordCount(activeBusiness!.id, selected.id, {
        product_id: Number(countForm.product_id),
        physical_quantity: Number(countForm.physical_quantity),
      });
      toast({ title: "Success", description: "Count recorded" });
      setIsCountOpen(false);
      setCountForm({ product_id: "", physical_quantity: "" });
      fetchSessions();
    } catch {
      toast({ title: "Error", description: "Failed to record count", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleAdjust = async (sessionId: number) => {
    try {
      await stockService.adjustInventory(activeBusiness!.id, sessionId);
      toast({ title: "Success", description: "Inventory adjusted and session closed" });
      fetchSessions();
    } catch {
      toast({ title: "Error", description: "Adjustment failed", variant: "destructive" });
    }
  };

  const handleViewReport = async (session: any) => {
    try {
      const res = await stockService.getVarianceReport(activeBusiness!.id, session.id);
      setReport(res.data);
      setSelected(session);
      setIsReportOpen(true);
    } catch {
      toast({ title: "Error", description: "Failed to load report", variant: "destructive" });
    }
  };

  const filtered = sessions.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openSessions = sessions.filter(s => s.status === "open").length;
  const closedSessions = sessions.filter(s => s.status === "closed").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Inventory Sessions</h1>
          <p className="text-muted-foreground mt-1">Manage physical inventory counts</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <label htmlFor="session-search" className="sr-only">Search inventory sessions</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="session-search"
              type="search"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> New Session
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label="Inventory statistics">
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Total Sessions</p>
            <h2 className="text-4xl font-bold mt-2">{sessions.length}</h2>
            <p className="text-xs text-slate-400 mt-2">All time</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-violet-500 to-violet-700 text-white overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-violet-100 uppercase tracking-widest">Open</p>
            <h2 className="text-4xl font-bold mt-2">{openSessions}</h2>
            <p className="text-xs text-violet-200 mt-2">In progress</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-700 text-white overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-emerald-100 uppercase tracking-widest">Closed</p>
            <h2 className="text-4xl font-bold mt-2">{closedSessions}</h2>
            <p className="text-xs text-emerald-200 mt-2">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16" role="status" aria-label="Loading inventory sessions">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
            <ClipboardCheck className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">No inventory sessions yet</h2>
            <p className="text-muted-foreground mt-1">Create your first session to start counting</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> New Session
          </Button>
        </div>
      )}

      {/* Sessions List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4" role="list" aria-label="Inventory sessions">
          {filtered.map((session) => {
            const isExpanded = expandedId === session.id;
            const panelId = `session-panel-${session.id}`;
            const headerId = `session-header-${session.id}`;
            return (
              <Card key={session.id} role="listitem" className="rounded-xl shadow-sm border border-border overflow-hidden">
                <CardHeader
                  id={headerId}
                  className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors py-4"
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : session.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {session.status === "open"
                      ? <Clock className="h-5 w-5 text-violet-500" aria-hidden="true" />
                      : <CheckCircle className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                    }
                    <div>
                      <CardTitle className="text-base">{session.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created {new Date(session.created_at).toLocaleDateString("en-GB")}
                        {session.closed_at && ` · Closed ${new Date(session.closed_at).toLocaleDateString("en-GB")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${session.status === "open"
                          ? "bg-violet-50 text-violet-700 border border-violet-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      aria-label={`Status: ${session.status}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${session.status === "open" ? "bg-violet-500" : "bg-emerald-500"}`} aria-hidden="true" />
                      {session.status === "open" ? "Open" : "Closed"}
                    </span>
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    }
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent id={panelId} role="region" aria-labelledby={headerId} className="pt-0 pb-4 space-y-4">
                    {/* Counts table */}
                    {session.counts?.length > 0 && (
                      <table className="w-full text-sm" aria-label={`Counts for ${session.name}`}>
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th scope="col" className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Product</th>
                            <th scope="col" className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">System Qty</th>
                            <th scope="col" className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Physical Qty</th>
                            <th scope="col" className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Variance</th>
                            <th scope="col" className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Adjusted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {session.counts.map((c: any) => (
                            <tr key={c.id} className="hover:bg-muted/20">
                              <td className="p-3 font-medium">{c.products?.name}</td>
                              <td className="p-3 text-muted-foreground">{c.system_quantity}</td>
                              <td className="p-3 text-muted-foreground">{c.physical_quantity}</td>
                              <td className="p-3">
                                <span className={`font-semibold ${c.variance > 0 ? "text-emerald-600" : c.variance < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                  {c.variance > 0 ? "+" : ""}{c.variance}
                                </span>
                              </td>
                              <td className="p-3">
                                {c.adjusted
                                  ? <span className="text-emerald-600 text-xs font-medium">Yes</span>
                                  : <span className="text-muted-foreground text-xs">No</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {session.status === "open" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openCountModal(session)}>
                            <Plus className="h-3 w-3 mr-1" aria-hidden="true" /> Record Count
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAdjust(session.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" /> Adjust & Close
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleViewReport(session)}>
                        View Report
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Session Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Inventory Session</DialogTitle></DialogHeader>
          <div>
            <label htmlFor="session-name" className="text-sm font-medium mb-1 block">Session Name</label>
            <Input
              id="session-name"
              placeholder="e.g. Q1 2026 Inventory Count"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={formLoading || !sessionName}>
              {formLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Count Modal */}
      <Dialog open={isCountOpen} onOpenChange={(open) => { if (!open) { setIsCountOpen(false); setCountForm({ product_id: "", physical_quantity: "" }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Physical Count — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="count-product" className="text-sm font-medium mb-1 block">Product</label>
              <select
                id="count-product"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={countForm.product_id}
                onChange={e => setCountForm({ ...countForm, product_id: e.target.value })}
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
              <label htmlFor="physical-qty" className="text-sm font-medium mb-1 block">Physical Quantity</label>
              <Input
                id="physical-qty"
                placeholder="0"
                type="number"
                min="0"
                value={countForm.physical_quantity}
                onChange={e => setCountForm({ ...countForm, physical_quantity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCountOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRecordCount}
              disabled={formLoading || !countForm.product_id || countForm.physical_quantity === ""}
            >
              {formLoading ? "Saving..." : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variance Report Modal */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Variance Report — {selected?.name}</DialogTitle></DialogHeader>
          {report.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No counts recorded yet.</p>
          ) : (
            <table className="w-full text-sm" aria-label={`Variance report for ${selected?.name}`}>
              <thead>
                <tr className="border-b bg-muted/40">
                  <th scope="col" className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Product</th>
                  <th scope="col" className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">System</th>
                  <th scope="col" className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Physical</th>
                  <th scope="col" className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Variance</th>
                  <th scope="col" className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase">Adjusted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {report.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="p-3 font-medium">{r.product}</td>
                    <td className="p-3 text-muted-foreground">{r.system_quantity}</td>
                    <td className="p-3 text-muted-foreground">{r.physical_quantity}</td>
                    <td className="p-3">
                      <span className={`font-semibold ${r.variance > 0 ? "text-emerald-600" : r.variance < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {r.variance > 0 ? "+" : ""}{r.variance}
                      </span>
                    </td>
                    <td className="p-3">
                      {r.adjusted
                        ? <span className="text-emerald-600 text-xs font-medium">Yes</span>
                        : <span className="text-muted-foreground text-xs">No</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}