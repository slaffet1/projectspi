import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Eye, Edit, Building2, MapPin } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { SearchInput } from "@/app/components/SearchInput"; // Assurez-vous d'utiliser ce composant
import { toast } from "react-toastify";
import { useBusiness } from "@/app/context/BusinessContext";
import { supplierService } from "@/app/services/supplierService";

export default function Suppliers() {
  const { activeBusiness, hasPermission } = useBusiness();
  const businessId = activeBusiness?.id;
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const canCreate = true; 
  const canDelete = true;
  const canUpdate = true;

  useEffect(() => {
    if (!businessId) return;
    fetchSuppliers();
  }, [businessId]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await supplierService.getAll(businessId!);
      setSuppliers(res.data);
    } catch {
      toast.error("Erreur de chargement des fournisseurs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer ce fournisseur ? Cette action est irréversible.")) return;
    
    try {
      await supplierService.delete(businessId!, id);
      setSuppliers(suppliers.filter((s) => s.id !== id));
      toast.success("Fournisseur supprimé avec succès !");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Impossible de supprimer ce fournisseur.");
    }
  };

  const filtered = suppliers.filter(s => {
    const matchSearch =
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery);
    return matchSearch;
  });

  // Stats
  const stats = {
    total: suppliers.length,
    withEmail: suppliers.filter(s => s.email).length,
    withPhone: suppliers.filter(s => s.phone).length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Fournisseurs
          </h1>
          <p className="text-muted-foreground mt-1">Gérez la liste de vos fournisseurs et partenaires commerciaux.</p>
        </div>
        {canCreate && (
          <Link to="/app/suppliers/new">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau fournisseur
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              {/* Utilisation du composant SearchInput de votre design */}
              <SearchInput
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            {/* Si vous aviez un filtre Select pour les fournisseurs (ex: par catégorie), il irait ici */}
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
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Nom du fournisseur</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Contact</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Localisation</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Matricule Fiscal</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      Chargement...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      Aucun fournisseur trouvé
                    </td>
                  </tr>
                ) : filtered.map(s => (
                  <tr
                    key={s.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/suppliers/${s.id}/edit`)}
                  >
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-primary">{s.name}</span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex flex-col gap-1">
                        {s.email ? <span>{s.email}</span> : <span className="text-muted-foreground italic">Pas d'email</span>}
                        {s.phone && <span className="text-muted-foreground">{s.phone}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {s.city || s.country ? (
                          <>
                            <MapPin className="h-3 w-3" />
                            <span>{[s.city, s.country].filter(Boolean).join(", ")}</span>
                          </>
                        ) : (
                          <span className="italic">Non renseigné</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {s.tax_number || "-"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {canUpdate && (
                          <Link to={`/app/suppliers/${s.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Modifier">
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                          </Link>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Supprimer"
                            onClick={(e) => handleDelete(s.id, e)}
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

      {/* Stats - Adaptées pour les fournisseurs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total fournisseurs', value: stats.total, color: 'text-primary' },
          { label: 'Contacts Email', value: stats.withEmail, color: 'text-blue-600' },
          { label: 'Contacts Téléphone', value: stats.withPhone, color: 'text-green-600' },
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