import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Building2, Save, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { toast } from "react-toastify";
import { useBusiness } from "@/app/context/BusinessContext";
import { supplierService } from "@/app/services/supplierService";

export default function SupplierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;

  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    tax_number: "",
  });

  useEffect(() => {
    if (isEditing && businessId) {
      fetchSupplier();
    }
  }, [id, businessId]);

  const fetchSupplier = async () => {
    try {
      // Si vous n'avez pas créé la route "findOne" dans le frontend, ajoutez-la dans supplierService.ts :
      // getById: (bId: number, id: number) => api.get(`/api/businesses/${bId}/suppliers/${id}`)
      const res = await supplierService.getById(businessId!, Number(id));
      const s = res.data;
      setFormData({
        name: s.name || "",
        email: s.email || "",
        phone: s.phone || "",
        address: s.address || "",
        city: s.city || "",
        country: s.country || "",
        tax_number: s.tax_number || "",
      });
    } catch (error) {
      toast.error("Erreur lors du chargement du fournisseur");
      navigate("/app/suppliers");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await supplierService.update(businessId!, Number(id), formData);
        toast.success("Fournisseur mis à jour !");
      } else {
        await supplierService.create(businessId!, formData);
        toast.success("Fournisseur créé !");
      }
      navigate("/app/suppliers");
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/app/suppliers">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            {isEditing ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Nom de l'entreprise *</label>
                <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Ex: Tech Solutions Inc." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@entreprise.com" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+216 XX XXX XXX" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Adresse</label>
                <Input name="address" value={formData.address} onChange={handleChange} placeholder="123 Rue de la Liberté" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ville</label>
                <Input name="city" value={formData.city} onChange={handleChange} placeholder="Tunis" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pays</label>
                <Input name="country" value={formData.country} onChange={handleChange} placeholder="Tunisie" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Matricule Fiscal / NIF</label>
                <Input name="tax_number" value={formData.tax_number} onChange={handleChange} placeholder="Ex: 1234567M/A/M/000" />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t mt-6 gap-3">
              <Link to="/app/suppliers">
                <Button type="button" variant="outline">Annuler</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isEditing ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}