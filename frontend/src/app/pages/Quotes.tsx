import { useEffect, useState } from "react";
import { Plus, Filter, Trash2, Eye, FileCheck, Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { SearchInput } from "@/app/components/SearchInput";
import { Link, useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { QuoteStatusBadge } from "@/app/components/QuoteStatusBadge";
import { quoteService } from "@/app/services/quoteService";
import { useBusiness } from "@/app/context/BusinessContext";
import { toast } from "react-toastify";

export default function Quotes() {
  const { activeBusiness, hasPermission } = useBusiness();
  const businessId = activeBusiness?.id;
  const navigate = useNavigate();

  const [quotes,       setQuotes]       = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery,  setSearchQuery]  = useState("");

  /*const canCreate = hasPermission('quote:create');
  const canDelete = hasPermission('quote:delete');
  const canUpdate = hasPermission('quote:update');
*/
const canCreate = true;
const canDelete = true;
const canUpdate = true;
  useEffect(() => {
    if (!businessId) return;
    fetchQuotes();
  }, [businessId]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await quoteService.getAll(businessId!);
      setQuotes(res.data);
    } catch {
      toast.error("Erreur de chargement des devis");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer ce devis ?")) return;
    try {
      await quoteService.remove(businessId!, id);
      setQuotes(quotes.filter(q => q.id !== id));
      toast.success("Devis supprimé");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erreur lors de la suppression");
    }
  };

  const handleSend = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await quoteService.send(businessId!, id);
      setQuotes(quotes.map(q => q.id === id ? { ...q, status: 'sent' } : q));
      toast.success("Devis marqué comme envoyé");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erreur");
    }
  };

  const filtered = quotes.filter(q => {
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    const matchSearch =
      q.quote_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Stats
  const stats = {
    total:    quotes.length,
    draft:    quotes.filter(q => q.status === 'draft').length,
    sent:     quotes.filter(q => q.status === 'sent').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    totalAmt: quotes.reduce((s, q) => s + Number(q.total_amount), 0),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Devis</h1>
          <p className="text-muted-foreground mt-1">Gérez tous vos devis clients</p>
        </div>
        {canCreate && (
          <Link to="/app/quotes/new">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau devis
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Rechercher par numéro ou client..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyé</SelectItem>
                <SelectItem value="accepted">Accepté</SelectItem>
                <SelectItem value="rejected">Refusé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="converted">Converti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Numéro</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Client</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Expiration</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Montant TTC</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Statut</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Aucun devis trouvé
                    </td>
                  </tr>
                ) : filtered.map(q => (
                  <tr
                    key={q.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/quotes/${q.id}`)}
                  >
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-primary">{q.quote_id}</span>
                    </td>
                    <td className="py-4 px-6 text-sm">{q.clients?.name ?? '—'}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {new Date(q.issue_date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {new Date(q.expiration_date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium">
                      {Number(q.total_amount).toLocaleString("fr-TN")} DT
                    </td>
                    <td className="py-4 px-6">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Link to={`/app/quotes/${q.id}`}>
                          <Button variant="ghost" size="sm" title="Voir">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {canUpdate && q.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Envoyer"
                            onClick={(e) => handleSend(q.id, e)}
                          >
                            <Send className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {canDelete && ['draft', 'cancelled'].includes(q.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Supprimer"
                            onClick={(e) => handleDelete(q.id, e)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total devis',   value: stats.total,                          color: '' },
          { label: 'Brouillons',    value: stats.draft,                          color: 'text-gray-600' },
          { label: 'Envoyés',       value: stats.sent,                           color: 'text-blue-600' },
          { label: 'Acceptés',      value: stats.accepted,                       color: 'text-green-600' },
        ].map(s => (
          <Card key={s.label} className="border-border shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}