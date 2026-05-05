import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Save, FileText } from "lucide-react";
import { useBusiness } from "@/app/context/BusinessContext";

const API_URL = "/api";

const InvoiceSettings = () => {
  const [invoicePrefix, setInvoicePrefix] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const { activeBusiness, isAdmin } = useBusiness();
  const businessId = activeBusiness?.id;
  const CURRENT_ROLE: "admin" | "owner" = isAdmin() ? "admin" : "owner";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/businesses/${businessId}/invoice-settings`);
      const data = await response.json();
      setInvoicePrefix(data.invoice_prefix || "");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}/businesses/${businessId}/invoice-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_prefix: invoicePrefix }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres de facturation</h1>
        <p className="text-muted-foreground">Configurez le format de vos factures</p>
      </div>

      {/* Prefix de facture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Format de numérotation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Préfixe de facture</Label>
              <Input
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="Ex: INV-"
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Ce préfixe sera ajouté au début de chaque numéro de facture
              </p>
            </div>

            {/* Aperçu */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Aperçu :</p>
              <div className="flex gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Facture 1 : </span>
                  <span className="font-mono font-medium">{invoicePrefix}2026-001</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Facture 2 : </span>
                  <span className="font-mono font-medium">{invoicePrefix}2026-002</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Facture 3 : </span>
                  <span className="font-mono font-medium">{invoicePrefix}2026-003</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
              {saved && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ Paramètres enregistrés avec succès
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lien vers les taxes */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Gestion des taxes</p>
              <p className="text-sm text-muted-foreground">
                Configurez les taux de TVA et autres taxes
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = "/app/settings/taxes"}>
              Gérer les taxes →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceSettings;