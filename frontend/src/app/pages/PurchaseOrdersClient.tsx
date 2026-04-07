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
      draft:     "Brouillon",
      sent:      "Envoyé",
      confirmed: "Confirmé",
      invoiced:  "Facturé",
      cancelled: "Annulé",
    };
    const dots: Record<string, string> = {
      draft:     "bg-slate-400",
      sent:      "bg-sky-500",
      confirmed: "bg-emerald-500",
      invoiced:  "bg-violet-500",
      cancelled: "bg-rose-500",
    };
    const statusLabel = labels[status ?? ""] || "Inconnu";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          styles[status ?? ""] || "bg-slate-50 text-slate-600 border border-slate-200"
        }`}
       
      >
        
        <span className={`w-1.5 h-1.5 rounded-full ${dots[status ?? ""] || "bg-slate-400"}`} aria-hidden="true" />
        {statusLabel}
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

      <a
        href="#orders-table"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Aller au tableau des commandes
      </a>

      {/* En-tête */}
      <header className="flex items-center justify-between">
        <div>
   
          <h1 className="text-3xl font-semibold tracking-tight">Bons de commande</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gérer tous les bons de commande clients
          </p>
        </div>
        <Link to="/app/purchase-orders-client/create">
          <Button className="rounded-xl gap-2 shadow-sm" aria-label="Créer un nouveau bon de commande">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouveau bon de commande
          </Button>
        </Link>
      </header>

      <section aria-label="Statistiques des bons de commande">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

 
          <article
            aria-label={`Total des bons de commande : ${totalCount}`}
            className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative"
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                    Total des commandes
                  </p>
                  <p className="text-4xl font-bold mt-2 tabular-nums" aria-hidden="true">
                    {totalCount}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Toutes périodes</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm" aria-hidden="true">
                  <FileText className="h-5 w-5 text-slate-200" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5" aria-hidden="true" />
            </div>
          </article>

          
          <article
            aria-label={`Bons de commande confirmés : ${confirmedCount}`}
            className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-700 text-white overflow-hidden relative"
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-100 uppercase tracking-widest">
                    Confirmés
                  </p>
                  <p className="text-4xl font-bold mt-2 tabular-nums" aria-hidden="true">
                    {confirmedCount}
                  </p>
                  <p className="text-xs text-emerald-200 mt-2">Prêts à facturer</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm" aria-hidden="true">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
            </div>
          </article>

      
          <article
            aria-label={`Bons de commande facturés : ${invoicedCount}`}
            className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-violet-500 to-violet-700 text-white overflow-hidden relative"
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-violet-100 uppercase tracking-widest">
                    Facturés
                  </p>
                  <p className="text-4xl font-bold mt-2 tabular-nums" aria-hidden="true">
                    {invoicedCount}
                  </p>
                  <p className="text-xs text-violet-200 mt-2">Convertis en facture</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm" aria-hidden="true">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
            </div>
          </article>

          <article
            aria-label={`Bons de commande annulés : ${cancelledCount}`}
            className="rounded-2xl border-0 shadow-md bg-gradient-to-br from-rose-500 to-rose-700 text-white overflow-hidden relative"
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-rose-100 uppercase tracking-widest">
                    Annulés
                  </p>
                  <p className="text-4xl font-bold mt-2 tabular-nums" aria-hidden="true">
                    {cancelledCount}
                  </p>
                  <p className="text-xs text-rose-200 mt-2">Commandes annulées</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm" aria-hidden="true">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
            </div>
          </article>
        </div>
      </section>

    
      <search aria-label="Filtrer les bons de commande">
        <Card className="rounded-2xl shadow-sm border border-border/60">
          <CardContent className="pt-5 pb-5 flex gap-4">
           
            <SearchInput
              placeholder="Rechercher par numéro ou client…"
              value={searchQuery}
              onChange={setSearchQuery}
         
              aria-label="Rechercher un bon de commande ou un client"
            />
            <div className="flex items-center gap-2">
          
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-52 rounded-xl"
                  aria-label="Filtrer par statut"
                >
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyé</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="invoiced">Facturé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </search>

 
      <Card className="rounded-2xl shadow-sm border border-border/60 overflow-hidden">
        <CardContent className="p-0">
     
          <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {filteredOrders.length} bon(s) de commande trouvé(s)
            {searchQuery ? ` pour la recherche "${searchQuery}"` : ""}
            {statusFilter !== "all" ? ` avec le statut "${statusFilter}"` : ""}
          </div>

    
          <table
            id="orders-table"
            className="w-full"
            aria-label="Liste des bons de commande"
          >
            <caption className="sr-only">
              Bons de commande clients — page {currentPage} sur {totalPages || 1},
              {filteredOrders.length} résultat(s)
            </caption>
            <thead>
              <tr className="border-b bg-muted/40">
                <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">N° de commande</th>
                <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date d'émission</th>
                <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date d'expiration</th>
                <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant</th>
                <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Facture</th>
                <th scope="col" className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
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
                      aria-label={`Voir le bon de commande ${order.order_number}`}
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="p-4 text-sm font-medium">{order.clients?.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">
              
                    <time dateTime={order.issue_date}>
                      {new Date(order.issue_date).toLocaleDateString("fr-FR")}
                    </time>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {order.expiration_date ? (
                      <time dateTime={order.expiration_date}>
                        {new Date(order.expiration_date).toLocaleDateString("fr-FR")}
                      </time>
                    ) : (
                      <span aria-label="Pas de date d'expiration">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-semibold tabular-nums">
                      {Number(order.total_amount).toLocaleString("fr-TN")} DT
                    </span>
                  </td>
                  <td className="p-4">{getStatusBadge(order.status)}</td>

                  <td className="p-4">
                    {order.status === "invoiced" && order.invoices?.[0] ? (
                      <Link
                        to={`/app/invoices/${order.invoices[0].id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline underline-offset-4"
                
                        aria-label={`Voir la facture ${order.invoices[0].invoice_number} liée à ce bon de commande`}
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        {order.invoices[0].invoice_number}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs" aria-label="Aucune facture">-</span>
                    )}
                  </td>

                  <td className="p-4">
                    <Link to={`/app/purchase-orders-client/${order.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs px-3 h-8 border-border/70 hover:bg-muted"
                     
                        aria-label={`Voir les détails du bon de commande ${order.order_number}`}
                      >
                        Détails
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center text-muted-foreground text-sm"
                   
                  >
                    Aucun bon de commande trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

         
          {totalPages > 1 && (
         
            <nav
              aria-label="Pagination des bons de commande"
              className="flex justify-center gap-1.5 py-4 border-t border-border/50"
            >
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={p === currentPage ? "default" : "ghost"}
                  onClick={() => setCurrentPage(p)}
                
                  aria-current={p === currentPage ? "page" : undefined}
                  aria-label={`Page ${p}${p === currentPage ? " (page actuelle)" : ""}`}
                  className={`w-8 h-8 p-0 rounded-lg text-xs ${
                    p === currentPage ? "shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {p}
                </Button>
              ))}
            </nav>
          )}
        </CardContent>
      </Card>
    </div>
  );
}