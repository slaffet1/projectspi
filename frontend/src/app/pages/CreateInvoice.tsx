import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { mockClients } from "@/app/data/mockData";
import { Link, useNavigate } from "react-router";

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, taxRate: 19 },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, taxRate: 19 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateItemTotal = (item: InvoiceLineItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const tax = subtotal * (item.taxRate / 100);
    return subtotal + tax;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100),
      0
    );
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const totals = calculateTotals();

  const handleSaveDraft = () => {
    // Logique de sauvegarde en brouillon
    navigate("/invoices");
  };

  const handleSendInvoice = () => {
    // Logique d'envoi de facture
    navigate("/invoices");
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link to="/app/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Nouvelle facture
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et envoyez une facture à votre client
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations client */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Sélectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Date de facture</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Date d'échéance</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Articles</CardTitle>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-3 p-4 bg-muted/30 rounded-lg"
                >
                  <div className="col-span-5">
                    <Label>Description</Label>
                    <Input
                      placeholder="Service ou produit"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", parseInt(e.target.value) || 0)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Prix unitaire</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>TVA %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.taxRate}
                      onChange={(e) =>
                        updateItem(item.id, "taxRate", parseFloat(e.target.value) || 0)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="col-span-12 text-right text-sm font-medium text-muted-foreground">
                    Total ligne: {calculateItemTotal(item).toFixed(2)} DT
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Récapitulatif */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm sticky top-8">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="font-medium">
                    {totals.subtotal.toFixed(2)} DT
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA</span>
                  <span className="font-medium">{totals.tax.toFixed(2)} DT</span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total TTC</span>
                    <span className="text-xl font-bold text-primary">
                      {totals.total.toFixed(2)} DT
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <Button
                  onClick={handleSendInvoice}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Valider et envoyer
                </Button>
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer en brouillon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
