import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { businessService } from '../services/businessService';
import { useBusiness } from '../context/BusinessContext';
import { toast } from 'react-toastify';

export default function CreateBusiness() {
  const navigate = useNavigate();
  const { refreshBusinesses, switchBusiness } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: '',
    legal_name: '',
    matricule_fiscale: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    phone: '',
    email: '',
    invoice_prefix: 'INV-',
  });

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Le nom est requis';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email invalide';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const res = await businessService.createBusiness(form);
      const newBusiness = res.data;
      await refreshBusinesses();
      await switchBusiness(newBusiness.id);
      toast.success('Entreprise créée avec succès !');
      navigate('/app/businesses');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Créer une entreprise</h1>
          <p className="text-muted-foreground text-sm">Vous serez automatiquement propriétaire</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-blue-600" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <Label>Nom de l'entreprise *</Label>
              <Input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="United Brains"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Legal name */}
            <div>
              <Label>Raison sociale</Label>
              <Input
                value={form.legal_name}
                onChange={e => set('legal_name', e.target.value)}
                placeholder="United Brains SARL"
              />
            </div>

            {/* Matricule fiscale */}
            <div>
              <Label>Matricule fiscale</Label>
              <Input
                value={form.matricule_fiscale}
                onChange={e => set('matricule_fiscale', e.target.value)}
                placeholder="1234567/A/M/000"
              />
            </div>

            {/* Email */}
            <div>
              <Label>Email professionnel</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="contact@entreprise.tn"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <Label>Téléphone</Label>
              <Input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+216 XX XXX XXX"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adresse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Adresse</Label>
              <Input
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="Rue de la République"
              />
            </div>
            <div>
              <Label>Ville</Label>
              <Input
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="Tunis"
              />
            </div>
            <div>
              <Label>Code postal</Label>
              <Input
                value={form.postal_code}
                onChange={e => set('postal_code', e.target.value)}
                placeholder="1000"
              />
            </div>
            <div>
              <Label>Pays</Label>
              <Input
                value={form.country}
                onChange={e => set('country', e.target.value)}
                placeholder="Tunisie"
              />
            </div>
            <div>
              <Label>Préfixe facture</Label>
              <Input
                value={form.invoice_prefix}
                onChange={e => set('invoice_prefix', e.target.value)}
                placeholder="INV-"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Création...' : 'Créer l\'entreprise'}
        </button>
      </div>
    </div>
  );
}