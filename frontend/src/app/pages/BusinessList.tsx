import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight, Crown, Shield, Users, Calculator, BarChart3 } from 'lucide-react';
import { useBusiness, Business } from '../context/BusinessContext';

const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
  OWNER:          { label: 'Propriétaire',    color: 'bg-purple-100 text-purple-700', icon: Crown },
  ADMIN:          { label: 'Administrateur',  color: 'bg-blue-100 text-blue-700',    icon: Shield },
  ACCOUNTANT:     { label: 'Comptable',       color: 'bg-green-100 text-green-700',  icon: Calculator },
  MEMBER:         { label: 'Membre',          color: 'bg-gray-100 text-gray-700',    icon: Users },
  PLATFORM_ADMIN: { label: 'Admin Plateforme',color: 'bg-red-100 text-red-700',      icon: Shield },
};

export default function BusinessList() {
  const { businesses, activeBusiness, switchBusiness, refreshBusinesses, loading } = useBusiness();
  const [switching, setSwitching] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    refreshBusinesses();
  }, []);

 const handleSwitch = async (b: Business) => {
  setSwitching(b.id);

  const res = await switchBusiness(b.id);

  // Conversion en string pour localStorage
  localStorage.setItem('businessId', res.business.id.toString());

  setSwitching(null);
  navigate('/app');
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
          onClick={() => navigate('/businesses/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          <Plus className="h-4 w-4" />
          Nouvelle entreprise
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-20 space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Mes Entreprises</h1>
          <p className="text-muted-foreground">Gérez et naviguez entre vos espaces de travail</p>
        </div>

        {/* Active business banner */}
        {activeBusiness && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">{activeBusiness.name.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Espace actif</p>
              <p className="text-sm text-blue-700">{activeBusiness.name}</p>
            </div>
          </div>
        )}

        {/* Business grid */}
        {loading && businesses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl flex flex-col items-center justify-center py-16 gap-4 shadow-sm">
            <Building2 className="h-16 w-16 text-gray-300" />
            <div className="text-center">
              <p className="font-semibold text-gray-700">Aucune entreprise</p>
              <p className="text-sm text-muted-foreground mt-1">
                Créez votre première entreprise pour commencer
              </p>
            </div>
            <button
              onClick={() => navigate('/businesses/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              <Plus className="h-4 w-4" />
              Créer une entreprise
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((b) => {
              const role = b.your_role ?? 'MEMBER';
              const cfg = roleConfig[role] ?? roleConfig.MEMBER;
              const RoleIcon = cfg.icon;
              const isActive = activeBusiness?.id === b.id;

              return (
                <div
                  key={b.id}
                  className={`relative bg-white border-2 rounded-2xl p-5 hover:shadow-md transition-all duration-200 ${
                    isActive ? 'border-blue-500 shadow-md' : 'border-border hover:border-blue-200'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-blue-500" />
                  )}

                  {/* Header card */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-lg">
                        {b.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{b.name}</p>
                      {b.legal_name && (
                        <p className="text-xs text-muted-foreground truncate">{b.legal_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Role badge */}
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                      <RoleIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Infos */}
                  <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    {b.city && <p>📍 {b.city}{b.country ? `, ${b.country}` : ''}</p>}
                    {b.email && <p>✉️ {b.email}</p>}
                    {b.joined_at && (
                      <p>🗓 Rejoint le {new Date(b.joined_at).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitch(b)}
                        disabled={switching === b.id}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl transition disabled:opacity-60"
                      >
                        {switching === b.id ? (
                          <span>Chargement...</span>
                        ) : (
                          <>
                            <ArrowRight className="h-3.5 w-3.5" />
                            Activer
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/businesses/${b.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-border hover:bg-gray-50 text-xs font-medium py-2 rounded-xl transition"
                    >
                      Voir le profil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Retour onboarding */}
        <p className="text-center text-sm text-muted-foreground">
          <button
            onClick={() => navigate('/onboarding')}
            className="text-blue-600 hover:underline font-medium"
          >
            ← Retour à l'accueil
          </button>
        </p>

      </div>
    </div>
  );
}