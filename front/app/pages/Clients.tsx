import { useState } from "react";
import { Plus, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { SearchInput } from "@/app/components/SearchInput";
import { mockClients, mockInvoices } from "@/app/data/mockData";
import { Link } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = mockClients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre portefeuille clients
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Recherche */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <SearchInput
            placeholder="Rechercher un client par nom ou email..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </CardContent>
      </Card>

      {/* Liste des clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const clientInvoices = mockInvoices.filter(
            (inv) => inv.clientId === client.id
          );

          return (
            <Card key={client.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Link
                    to={`/app/clients/${client.id}`}
                    className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {client.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span>{client.address}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total facturé</span>
                    <span className="font-medium">
                      {client.totalInvoiced.toLocaleString("fr-TN")} DT
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impayé</span>
                    <span
                      className={`font-medium ${
                        client.totalUnpaid > 0 ? "text-destructive" : "text-success"
                      }`}
                    >
                      {client.totalUnpaid.toLocaleString("fr-TN")} DT
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Factures</span>
                    <span className="font-medium">{clientInvoices.length}</span>
                  </div>
                </div>

                <Link to={`/app/clients/${client.id}`}>
                  <Button variant="outline" className="w-full mt-2">
                    Voir le détail
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <Card className="border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Aucun client ne correspond à votre recherche
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total clients</p>
            <p className="text-2xl font-semibold mt-1">{mockClients.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Clients actifs</p>
            <p className="text-2xl font-semibold mt-1 text-success">
              {mockClients.filter((c) => c.totalInvoiced > 0).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total impayés</p>
            <p className="text-2xl font-semibold mt-1 text-destructive">
              {mockClients
                .reduce((sum, c) => sum + c.totalUnpaid, 0)
                .toLocaleString("fr-TN")}{" "}
              DT
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
