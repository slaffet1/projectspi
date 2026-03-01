import { ArrowLeft, Download, Send, Edit, Printer } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { StatusBadge } from "@/app/components/StatusBadge";
import { mockInvoices, mockClients } from "@/app/data/mockData";
import { Link, useParams } from "react-router";
import { Separator } from "@/app/components/ui/separator";

export default function InvoiceDetail() {
  const { id } = useParams();
  const invoice = mockInvoices.find((inv) => inv.id === id);
  const client = invoice ? mockClients.find((c) => c.id === invoice.clientId) : null;

  if (!invoice || !client) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Facture non trouvée</p>
      </div>
    );
  }

  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const totalTax = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100),
    0
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              Facture {invoice.number}
            </h1>
            <p className="text-muted-foreground mt-1">
              Détails de la facture
            </p>
          </div>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      {/* Actions */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button className="bg-primary hover:bg-primary/90">
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Envoyer par email
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Aperçu de la facture */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-8 md:p-12">
          {/* En-tête de la facture */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <span className="text-xl font-bold text-white">B</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  Business<span className="text-primary">Manager</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Avenue Habib Bourguiba
              </p>
              <p className="text-sm text-muted-foreground">Tunis, Tunisie</p>
              <p className="text-sm text-muted-foreground">+216 71 000 000</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-primary mb-2">FACTURE</h2>
              <p className="text-sm text-muted-foreground">N° {invoice.number}</p>
            </div>
          </div>

          {/* Informations client et dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                FACTURER À
              </h3>
              <p className="font-semibold text-foreground">{client.name}</p>
              <p className="text-sm text-muted-foreground">{client.address}</p>
              <p className="text-sm text-muted-foreground">{client.email}</p>
              <p className="text-sm text-muted-foreground">{client.phone}</p>
            </div>
            <div className="text-left md:text-right">
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">Date de facture</p>
                <p className="font-medium">
                  {new Date(invoice.date).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date d'échéance</p>
                <p className="font-medium">
                  {new Date(invoice.dueDate).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Tableau des articles */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 text-sm font-semibold text-muted-foreground">
                    DESCRIPTION
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-muted-foreground">
                    QTÉ
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-muted-foreground">
                    PRIX UNIT.
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-muted-foreground">
                    TVA
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-muted-foreground">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => {
                  const itemTotal = item.quantity * item.unitPrice;
                  const itemTax = itemTotal * (item.taxRate / 100);
                  const itemTotalWithTax = itemTotal + itemTax;

                  return (
                    <tr key={item.id} className="border-b border-border">
                      <td className="py-4 text-sm">{item.description}</td>
                      <td className="py-4 text-sm text-right">{item.quantity}</td>
                      <td className="py-4 text-sm text-right">
                        {item.unitPrice.toFixed(2)} DT
                      </td>
                      <td className="py-4 text-sm text-right">{item.taxRate}%</td>
                      <td className="py-4 text-sm text-right font-medium">
                        {itemTotalWithTax.toFixed(2)} DT
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span className="font-medium">{subtotal.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA</span>
                <span className="font-medium">{totalTax.toFixed(2)} DT</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total TTC</span>
                <span className="text-2xl font-bold text-primary">
                  {invoice.amount.toFixed(2)} DT
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Conditions de paiement :</strong> Paiement dû dans les 30 jours.
              Merci pour votre confiance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
