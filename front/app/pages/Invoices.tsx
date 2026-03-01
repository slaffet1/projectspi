import { useState } from "react";
import { Plus, Filter, Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { StatusBadge, InvoiceStatus } from "@/app/components/StatusBadge";
import { SearchInput } from "@/app/components/SearchInput";
import { mockInvoices } from "@/app/data/mockData";
import { Link } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesSearch =
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Factures</h1>
          <p className="text-muted-foreground mt-1">
            Gérez toutes vos factures clients
          </p>
        </div>
        <Link to="/app/invoices/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </Link>
      </div>

      {/* Filtres */}
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
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | "all")}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des factures */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Numéro
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Client
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Date
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Échéance
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Montant TTC
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Statut
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <Link
                        to={`/app/invoices/${invoice.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {invoice.number}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-sm">{invoice.clientName}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium">
                      {invoice.amount.toLocaleString("fr-TN")} DT
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Link to={`/app/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm">
                            Détails
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                Aucune facture ne correspond à vos critères de recherche
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total facturé</p>
            <p className="text-2xl font-semibold mt-1">
              {mockInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString("fr-TN")} DT
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Payées</p>
            <p className="text-2xl font-semibold mt-1 text-success">
              {mockInvoices.filter((inv) => inv.status === "paid").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-semibold mt-1 text-secondary">
              {mockInvoices.filter((inv) => inv.status === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En retard</p>
            <p className="text-2xl font-semibold mt-1 text-destructive">
              {mockInvoices.filter((inv) => inv.status === "overdue").length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
