import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { StatusBadge } from "@/app/components/StatusBadge";
import { mockClients, mockInvoices } from "@/app/data/mockData";
import { Link, useParams } from "react-router";

export default function ClientDetail() {
  const { id } = useParams();
  const client = mockClients.find((c) => c.id === id);
  const clientInvoices = mockInvoices.filter((inv) => inv.clientId === id);

  if (!client) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Client non trouvé</p>
      </div>
    );
  }

  const paidInvoices = clientInvoices.filter((inv) => inv.status === "paid");
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link to="/app/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-foreground">{client.name}</h1>
          <p className="text-muted-foreground mt-1">
            Détails et historique du client
          </p>
        </div>
        <Link to="/app/invoices/new">
          <Button className="bg-primary hover:bg-primary/90">
            Créer une facture
          </Button>
        </Link>
      </div>

      {/* Informations client */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="font-medium">{client.address}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total facturé</p>
                  <p className="text-xl font-semibold mt-1">
                    {client.totalInvoiced.toLocaleString("fr-TN")} DT
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total payé</p>
                  <p className="text-xl font-semibold mt-1 text-success">
                    {totalPaid.toLocaleString("fr-TN")} DT
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Impayé</p>
                  <p className="text-xl font-semibold mt-1 text-destructive">
                    {client.totalUnpaid.toLocaleString("fr-TN")} DT
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Factures</p>
                  <p className="text-xl font-semibold mt-1">
                    {clientInvoices.length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
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
                        Date
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                        Échéance
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                        Montant
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-foreground">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-border hover:bg-muted/30"
                      >
                        <td className="py-4 px-6">
                          <Link
                            to={`/app/invoices/${invoice.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {invoice.number}
                          </Link>
                        </td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Facture moyenne</p>
                <p className="text-2xl font-semibold mt-1">
                  {clientInvoices.length > 0
                    ? (
                        clientInvoices.reduce((sum, inv) => sum + inv.amount, 0) /
                        clientInvoices.length
                      ).toFixed(0)
                    : 0}{" "}
                  DT
                </p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Taux de paiement</p>
                <p className="text-2xl font-semibold mt-1 text-success">
                  {clientInvoices.length > 0
                    ? Math.round(
                        (paidInvoices.length / clientInvoices.length) * 100
                      )
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Dernière facture</p>
                <p className="text-2xl font-semibold mt-1">
                  {clientInvoices.length > 0
                    ? new Date(
                        clientInvoices[clientInvoices.length - 1].date
                      ).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
                    : "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
