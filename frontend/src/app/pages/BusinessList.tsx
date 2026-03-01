import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight, Crown, Shield, Users, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useBusiness, Business } from '../context/BusinessContext';

const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
  OWNER:          { label: 'Propriétaire', color: 'bg-purple-100 text-purple-700', icon: Crown },
  ADMIN:          { label: 'Administrateur', color: 'bg-blue-100 text-blue-700', icon: Shield },
  ACCOUNTANT:     { label: 'Comptable', color: 'bg-green-100 text-green-700', icon: Calculator },
  MEMBER:         { label: 'Membre', color: 'bg-gray-100 text-gray-700', icon: Users },
  PLATFORM_ADMIN: { label: 'Admin Plateforme', color: 'bg-red-100 text-red-700', icon: Shield },
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
    await switchBusiness(b.id);
    setSwitching(null);
    navigate('/app');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes Entreprises</h1>
          <p className="text-muted-foreground">
            Gérez et naviguez entre vos espaces de travail
          </p>
        </div>
        <button
          onClick={() => navigate('/app/businesses/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus className="h-4 w-4" />
          Nouvelle entreprise
        </button>
      </div>

      {/* Active business banner */}
      {activeBusiness && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold">{activeBusiness.name.charAt(0)}</span>
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
            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Building2 className="h-16 w-16 text-gray-300" />
            <div className="text-center">
              <p className="font-semibold text-gray-700">Aucune entreprise</p>
              <p className="text-sm text-muted-foreground mt-1">
                Créez votre première entreprise pour commencer
              </p>
            </div>
            <button
              onClick={() => navigate('/app/businesses/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="h-4 w-4" />
              Créer une entreprise
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((b) => {
            const role = b.your_role ?? 'MEMBER';
            const cfg = roleConfig[role] ?? roleConfig.MEMBER;
            const RoleIcon = cfg.icon;
            const isActive = activeBusiness?.id === b.id;

            return (
              <Card
                key={b.id}
                className={`relative hover:shadow-md transition cursor-pointer group ${
                  isActive ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {isActive && (
                  <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-blue-500" />
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-lg">
                        {b.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{b.name}</CardTitle>
                      {b.legal_name && (
                        <p className="text-xs text-muted-foreground truncate">{b.legal_name}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                      <RoleIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    {b.city && <p>📍 {b.city}{b.country ? `, ${b.country}` : ''}</p>}
                    {b.email && <p>✉️ {b.email}</p>}
                    {b.joined_at && (
                      <p>🗓 Rejoint le {new Date(b.joined_at).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitch(b)}
                        disabled={switching === b.id}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-lg transition disabled:opacity-60"
                      >
                        {switching === b.id ? (
                          <span>Changement...</span>
                        ) : (
                          <>
                            <ArrowRight className="h-3.5 w-3.5" />
                            Activer
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/app/businesses/${b.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 border hover:bg-gray-50 text-xs font-medium py-1.5 rounded-lg transition"
                    >
                      Voir le profil
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}