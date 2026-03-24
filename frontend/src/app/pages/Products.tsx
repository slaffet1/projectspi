import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, LayoutGrid, List, Package, X, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { SearchInput } from "@/app/components/SearchInput";
import { useBusiness } from "@/app/context/BusinessContext";
import { api } from "@/app/services/api";

// ─── Types ────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  description?: string;
  reference?: string;
  barcode?: string;
  unit_price: number;
  cost_price?: number;
  tax_rate?: number;
  category?: string;
  unit?: string;
  is_active: boolean;
  fournisseur_id?: number;
  created_at: string;
}

interface ProductForm {
  name: string;
  description: string;
  reference: string;
  barcode: string;
  unit_price: string;
  cost_price: string;
  tax_rate: string;
  category: string;
  unit: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", reference: "", barcode: "",
  unit_price: "", cost_price: "", tax_rate: "", category: "", unit: "pièce",
};

// ─── Formulaire modal ─────────────────────────────────────────
function ProductModal({
  product, onClose, onSave, businessId,
}: {
  product?: Product;
  onClose: () => void;
  onSave: () => void;
  businessId: number;
}) {
  const [form, setForm] = useState<ProductForm>(
    product ? {
      name: product.name,
      description: product.description ?? "",
      reference: product.reference ?? "",
      barcode: product.barcode ?? "",
      unit_price: String(product.unit_price),
      cost_price: String(product.cost_price ?? ""),
      tax_rate: String(product.tax_rate ?? ""),
      category: product.category ?? "",
      unit: product.unit ?? "pièce",
    } : emptyForm
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Le nom est requis";
    if (!form.unit_price) e.unit_price = "Le prix est requis";
    if (isNaN(Number(form.unit_price))) e.unit_price = "Prix invalide";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        reference: form.reference || undefined,
        barcode: form.barcode || undefined,
        unit_price: Number(form.unit_price),
        cost_price: form.cost_price ? Number(form.cost_price) : undefined,
        tax_rate: form.tax_rate ? Number(form.tax_rate) : undefined,
        category: form.category || undefined,
        unit: form.unit || "pièce",
      };
      if (product) {
        await api.put(`/api/businesses/${businessId}/products/${product.id}`, payload);
      } else {
        await api.post(`/api/businesses/${businessId}/products`, payload);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {product ? "Modifier le produit" : "Nouveau produit"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom */}
            <div className="md:col-span-2">
              <Label>Nom du produit *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Ex: Laptop Dell XPS" className={errors.name ? "border-red-500" : ""} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="Description du produit" />
            </div>

            {/* Référence */}
            <div>
              <Label>Référence</Label>
              <Input value={form.reference} onChange={e => set("reference", e.target.value)}
                placeholder="Ex: PROD-001" />
            </div>

            {/* Code barre */}
            <div>
              <Label>Code barre</Label>
              <Input value={form.barcode} onChange={e => set("barcode", e.target.value)}
                placeholder="Ex: 123456789" />
            </div>

            {/* Prix de vente */}
            <div>
              <Label>Prix de vente HT (DT) *</Label>
              <Input type="number" value={form.unit_price} onChange={e => set("unit_price", e.target.value)}
                placeholder="0.00" className={errors.unit_price ? "border-red-500" : ""} />
              {errors.unit_price && <p className="text-red-500 text-xs mt-1">{errors.unit_price}</p>}
            </div>

            {/* Prix d'achat */}
            <div>
              <Label>Prix d'achat (DT)</Label>
              <Input type="number" value={form.cost_price} onChange={e => set("cost_price", e.target.value)}
                placeholder="0.00" />
            </div>

            {/* TVA */}
            <div>
              <Label>Taux TVA (%)</Label>
              <Input type="number" value={form.tax_rate} onChange={e => set("tax_rate", e.target.value)}
                placeholder="Ex: 19" />
            </div>

            {/* Unité */}
            <div>
              <Label>Unité</Label>
              <select value={form.unit} onChange={e => set("unit", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                <option value="pièce">Pièce</option>
                <option value="kg">Kg</option>
                <option value="litre">Litre</option>
                <option value="mètre">Mètre</option>
                <option value="boîte">Boîte</option>
                <option value="heure">Heure</option>
              </select>
            </div>

            {/* Catégorie */}
            <div className="md:col-span-2">
              <Label>Catégorie</Label>
              <Input value={form.category} onChange={e => set("category", e.target.value)}
                placeholder="Ex: Informatique, Électronique..." />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button onClick={onClose}
            className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60">
            {loading ? "Enregistrement..." : product ? "Modifier" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────
export default function Products() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>(undefined);

  useEffect(() => {
    if (businessId) fetchProducts();
  }, [businessId]);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/api/businesses/${businessId}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    try {
      await api.delete(`/api/businesses/${businessId}/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await api.patch(`/api/businesses/${businessId}/products/${id}/toggle`);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: res.data.is_active } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditProduct(undefined);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Produits</h1>
          <p className="text-muted-foreground mt-1">Gérez votre catalogue de produits</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => { setEditProduct(undefined); setShowModal(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau produit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total produits</p>
            <p className="text-2xl font-semibold mt-1">{products.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Produits actifs</p>
            <p className="text-2xl font-semibold mt-1 text-green-600">
              {products.filter(p => p.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Catégories</p>
            <p className="text-2xl font-semibold mt-1">
              {new Set(products.map(p => p.category).filter(Boolean)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche + toggle vue */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchInput placeholder="Rechercher par nom, référence, catégorie..."
                value={search} onChange={setSearch} />
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <button onClick={() => setView("table")}
                className={`p-2 rounded-md transition ${view === "table" ? "bg-primary text-white" : "hover:bg-muted"}`}>
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => setView("grid")}
                className={`p-2 rounded-md transition ${view === "grid" ? "bg-primary text-white" : "hover:bg-muted"}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vue tableau */}
      {view === "table" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Liste des produits ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun produit trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nom</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Référence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Catégorie</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Prix HT</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">TVA</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Unité</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{p.name}</p>
                            {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{p.reference ?? "-"}</td>
                        <td className="py-3 px-4">
                          {p.category ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              {p.category}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="py-3 px-4 font-medium">{Number(p.unit_price).toFixed(3)} DT</td>
                        <td className="py-3 px-4 text-sm">{p.tax_rate ? `${p.tax_rate}%` : "-"}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{p.unit ?? "-"}</td>
                        <td className="py-3 px-4">
                          <button onClick={() => handleToggle(p.id)}>
                            {p.is_active ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                Actif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                                Inactif
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vue grid */}
      {view === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun produit trouvé</p>
            </div>
          ) : (
            filtered.map(p => (
              <Card key={p.id} className={`border-border shadow-sm hover:shadow-md transition-shadow ${!p.is_active ? "opacity-60" : ""}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <button onClick={() => handleToggle(p.id)}>
                      {p.is_active
                        ? <ToggleRight className="h-6 w-6 text-green-600" />
                        : <ToggleLeft className="h-6 w-6 text-gray-400" />
                      }
                    </button>
                  </div>
                  <CardTitle className="text-base mt-2">{p.name}</CardTitle>
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Prix HT</span>
                    <span className="font-semibold">{Number(p.unit_price).toFixed(3)} DT</span>
                  </div>
                  {p.cost_price && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prix achat</span>
                      <span>{Number(p.cost_price).toFixed(3)} DT</span>
                    </div>
                  )}
                  {p.tax_rate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TVA</span>
                      <span>{p.tax_rate}%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    {p.category ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {p.category}
                      </span>
                    ) : <span />}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && businessId && (
        <ProductModal
          product={editProduct}
          onClose={handleCloseModal}
          onSave={fetchProducts}
          businessId={businessId}
        />
      )}
    </div>
  );
}