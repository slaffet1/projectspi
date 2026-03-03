import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Loader2, BarChart3, MapPin } from 'lucide-react';
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
      navigate('/businesses');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">

      {/* Top nav — même style que onboarding */}
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-primary" />
          <span className="font-semibold text-lg text-foreground">Business Management</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </nav>

      {/* Contenu */}
      <div className="flex flex-col items-center px-4 pt-12 pb-20">

        {/* Header */}
        <div className="text-center mb-10 max-w-lg">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-5">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Créer une entreprise</h1>
          <p className="text-muted-foreground text-sm">
            Vous serez automatiquement propriétaire et pourrez inviter votre équipe.
          </p>
        </div>

        <div className="w-full max-w-2xl space-y-6">

          {/* Informations générales */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-foreground">Informations générales</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <Label>Raison sociale</Label>
                <Input
                  value={form.legal_name}
                  onChange={e => set('legal_name', e.target.value)}
                  placeholder="United Brains SARL"
                />
              </div>
              <div>
                <Label>Matricule fiscale</Label>
                <Input
                  value={form.matricule_fiscale}
                  onChange={e => set('matricule_fiscale', e.target.value)}
                  placeholder="1234567/A/M/000"
                />
              </div>
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
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+216 XX XXX XXX"
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
          </div>

          {/* Adresse */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-foreground">Adresse</h2>
            </div>
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
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Création...' : "Créer l'entreprise"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}