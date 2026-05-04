import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Pencil, Trash2, Plus, X, Settings } from "lucide-react";
import { useBusiness } from "@/app/context/BusinessContext";

const API_URL = "/api";

const AdminTaxSettings = ({ businessId }: { businessId: number | undefined }) => {
  const [taxes, setTaxes] = useState([]);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTaxes(); }, []);

  const fetchTaxes = async () => {
    try {
      const response = await fetch(`${API_URL}/taxes/default`);
      const data = await response.json();
      setTaxes(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching taxes:", error);
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !rate) return;
    try {
      await fetch(`${API_URL}/taxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rate: parseFloat(rate), description, is_default: true }),
      });
      setName(""); setRate(""); setDescription("");
      fetchTaxes();
    } catch (error) {
      console.error("Error creating tax:", error);
    }
  };

  const handleUpdate = async () => {
    if (!name || !rate || !editId) return;
    try {
      await fetch(`${API_URL}/taxes/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rate: parseFloat(rate), description }),
      });
      setName(""); setRate(""); setDescription(""); setEditId(null);
      fetchTaxes();
    } catch (error) {
      console.error("Error updating tax:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette taxe ?")) return;
    try {
      await fetch(`${API_URL}/taxes/${id}`, { method: "DELETE" });
      fetchTaxes();
    } catch (error) {
      console.error("Error deleting tax:", error);
    }
  };

  const handleEdit = (tax) => {
    setEditId(tax.id);
    setName(tax.name);
    setRate(tax.rate);
    setDescription(tax.description || "");
  };

  const handleCancel = () => {
    setEditId(null); setName(""); setRate(""); setDescription("");
  };

  if (loading) return <div className="p-6" role="status" aria-label="Chargement...">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion des Taxes</h1>
        <p className="text-muted-foreground">Configurez les taux de taxe globaux de la plateforme</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" aria-hidden="true" />
            {editId ? "Modifier la taxe" : "Ajouter une taxe globale"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="admin-tax-name" className="text-sm font-medium block mb-1">Nom</label>
              <Input
                id="admin-tax-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: TVA 19%"
              />
            </div>
            <div>
              <label htmlFor="admin-tax-rate" className="text-sm font-medium block mb-1">Taux (%)</label>
              <Input
                id="admin-tax-rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Ex: 19"
              />
            </div>
            <div>
              <label htmlFor="admin-tax-description" className="text-sm font-medium block mb-1">Description</label>
              <Input
                id="admin-tax-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Taux normal"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {editId ? (
              <>
                <Button onClick={handleUpdate}>
                  <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />Modifier
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" aria-hidden="true" />Annuler
                </Button>
              </>
            ) : (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />Ajouter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxes globales ({taxes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Liste des taxes globales">
              <thead>
                <tr className="border-b">
                  <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nom</th>
                  <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Taux</th>
                  <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                  <th scope="col" className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((tax) => (
                  <tr key={tax.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{tax.name}</td>
                    <td className="py-3 px-4">{tax.rate}%</td>
                    <td className="py-3 px-4 text-muted-foreground">{tax.description}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tax)} aria-label={`Modifier ${tax.name}`}>
                          <Pencil className="h-4 w-4 text-blue-600" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tax.id)} aria-label={`Supprimer ${tax.name}`}>
                          <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OwnerTaxSettings = ({ businessId }: { businessId: number | undefined }) => {
  const [taxes, setTaxes] = useState([]);
  const [enabledTaxes, setEnabledTaxes] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchTaxes(); }, []);

  const fetchTaxes = async () => {
    try {
      const response = await fetch(`${API_URL}/businesses/${businessId}/taxes`);
      const data = await response.json();
      setTaxes(data);
      const initial: Record<number, boolean> = {};
      data.forEach((tax) => { initial[tax.id] = true; });
      setEnabledTaxes(initial);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching taxes:", error);
      setLoading(false);
    }
  };

  const handleToggle = (taxId: number) => {
    setEnabledTaxes((prev) => ({ ...prev, [taxId]: !prev[taxId] }));
  };

  const handleAddCustomTax = async () => {
    if (!customName || !customRate) return;
    try {
      await fetch(`${API_URL}/taxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName,
          rate: parseFloat(customRate),
          description: customDescription,
          is_default: false,
          business_id: businessId,
        }),
      });
      setCustomName(""); setCustomRate(""); setCustomDescription("");
      setShowCustomForm(false);
      fetchTaxes();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error creating custom tax:", error);
    }
  };

  if (loading) return <div className="p-6" role="status" aria-label="Chargement...">Chargement...</div>;

  const defaultTaxes = taxes.filter((t) => t.is_default);
  const customTaxes = taxes.filter((t) => !t.is_default);
  const activeCount = Object.values(enabledTaxes).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion des Taxes</h1>
        <p className="text-muted-foreground">Activez les taxes applicables à votre entreprise</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Taxes disponibles</CardTitle>
            <span className="text-sm text-muted-foreground" aria-live="polite">{activeCount} taxe(s) active(s)</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3" aria-label="Taxes disponibles">
            {defaultTaxes.map((tax) => (
              <li key={tax.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${enabledTaxes[tax.id] ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {tax.rate}%
                  </span>
                  <div>
                    <p className="font-medium text-sm">{tax.name}</p>
                    {tax.description && <p className="text-xs text-muted-foreground">{tax.description}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(tax.id)}
                  role="switch"
                  aria-checked={enabledTaxes[tax.id] ?? false}
                  aria-label={`${enabledTaxes[tax.id] ? "Désactiver" : "Activer"} ${tax.name}`}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${enabledTaxes[tax.id] ? "bg-primary" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabledTaxes[tax.id] ? "translate-x-6" : "translate-x-1"}`} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Taxes personnalisées</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomForm(!showCustomForm)}
              aria-expanded={showCustomForm}
              aria-controls="custom-tax-form"
            >
              {showCustomForm
                ? <><X className="h-4 w-4 mr-2" aria-hidden="true" />Annuler</>
                : <><Plus className="h-4 w-4 mr-2" aria-hidden="true" />Ajouter</>
              }
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCustomForm && (
            <div id="custom-tax-form" className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="custom-tax-name" className="text-sm font-medium block mb-1">Nom</label>
                  <Input
                    id="custom-tax-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ex: Taxe spéciale"
                  />
                </div>
                <div>
                  <label htmlFor="custom-tax-rate" className="text-sm font-medium block mb-1">Taux (%)</label>
                  <Input
                    id="custom-tax-rate"
                    type="number"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    placeholder="Ex: 5"
                  />
                </div>
                <div>
                  <label htmlFor="custom-tax-description" className="text-sm font-medium block mb-1">Description</label>
                  <Input
                    id="custom-tax-description"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Optionnel"
                  />
                </div>
              </div>
              <Button onClick={handleAddCustomTax}>
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />Ajouter
              </Button>
            </div>
          )}

          {customTaxes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune taxe personnalisée pour le moment</p>
          ) : (
            <ul className="space-y-3" aria-label="Taxes personnalisées">
              {customTaxes.map((tax) => (
                <li key={tax.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {tax.rate}%
                    </span>
                    <div>
                      <p className="font-medium text-sm">{tax.name}</p>
                      {tax.description && <p className="text-xs text-muted-foreground">{tax.description}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(tax.id)}
                    role="switch"
                    aria-checked={enabledTaxes[tax.id] ?? false}
                    aria-label={`${enabledTaxes[tax.id] ? "Désactiver" : "Activer"} ${tax.name}`}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${enabledTaxes[tax.id] ? "bg-primary" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabledTaxes[tax.id] ? "translate-x-6" : "translate-x-1"}`} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {saved && (
            <p className="mt-3 text-sm text-green-600 font-medium" role="status" aria-live="polite">
              Taxe ajoutée avec succès
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TaxSettings = () => {
  const { activeBusiness, isAdmin } = useBusiness();
  const businessId = activeBusiness?.id;
  const CURRENT_ROLE: "admin" | "owner" = isAdmin() ? "admin" : "owner";

  return CURRENT_ROLE === "admin"
    ? <AdminTaxSettings businessId={businessId} />
    : <OwnerTaxSettings businessId={businessId} />;
};

export default TaxSettings;