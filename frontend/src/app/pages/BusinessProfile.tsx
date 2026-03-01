import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Save, X, Loader2, Building2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { businessService } from '../services/businessService';
import { useBusiness } from '../context/BusinessContext';
import { toast } from 'react-toastify';

export default function BusinessProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOwner, activeBusiness, refreshBusinesses } = useBusiness();

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<any>({});

  const businessId = Number(id) || activeBusiness?.id;

  useEffect(() => {
    if (!businessId) return;
    fetchBusiness();
  }, [businessId]);

  const fetchBusiness = async () => {
    setLoading(true);
    try {
      const res = await businessService.getBusiness(businessId!);
      setBusiness(res.data);
      setForm({
        name: res.data.name ?? '',
        legal_name: res.data.legal_name ?? '',
        matricule_fiscale: res.data.matricule_fiscale ?? '',
        address: res.data.address ?? '',
        city: res.data.city ?? '',
        postal_code: res.data.postal_code ?? '',
        country: res.data.country ?? '',
        phone: res.data.phone ?? '',
        email: res.data.email ?? '',
        invoice_prefix: res.data.invoice_prefix ?? 'INV-',
      });
    } catch {
      toast.error('Impossible de charger le profil');
      navigate('/app/businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await businessService.updateBusiness(businessId!, form);
      setBusiness(res.data);
      setEditing(false);
      await refreshBusinesses();
      toast.success('Profil mis à jour');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${business?.name}" ? Cette action est irréversible.`)) return;
    setDeleting(true);
    try {
      await businessService.deleteBusiness(businessId!);
      await refreshBusinesses();
      toast.success('Entreprise supprimée');
      navigate('/app/businesses');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const set = (field: string, value: string) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{business?.name}</h1>
            <p className="text-muted-foreground text-sm">{business?.legal_name}</p>
          </div>
        </div>

        {/* Actions — OWNER only */}
        {isOwner() && (
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Supprimer
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Enregistrer
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* General info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-blue-600" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Nom', field: 'name' },
            { label: 'Raison sociale', field: 'legal_name' },
            { label: 'Matricule fiscale', field: 'matricule_fiscale' },
            { label: 'Email', field: 'email' },
            { label: 'Téléphone', field: 'phone' },
            { label: 'Préfixe facture', field: 'invoice_prefix' },
          ].map(({ label, field }) => (
            <div key={field}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              {editing ? (
                <Input
                  value={form[field]}
                  onChange={e => set(field, e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">{business?.[field] || '—'}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adresse</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Adresse', field: 'address' },
            { label: 'Ville', field: 'city' },
            { label: 'Code postal', field: 'postal_code' },
            { label: 'Pays', field: 'country' },
          ].map(({ label, field }) => (
            <div key={field}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              {editing ? (
                <Input
                  value={form[field]}
                  onChange={e => set(field, e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm font-medium mt-1">{business?.[field] || '—'}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Members shortcut */}
      <Card
        className="cursor-pointer hover:shadow-md transition"
        onClick={() => navigate(`/app/members`)}
      >
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Membres de l'équipe</p>
              <p className="text-xs text-muted-foreground">
                {business?.business_users?.length ?? 0} membre(s)
              </p>
            </div>
          </div>
          <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  );
}