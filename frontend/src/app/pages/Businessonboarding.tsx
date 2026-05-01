import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, ArrowRight, LogOut, BarChart3, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBusiness } from "../context/BusinessContext";
import { JoinCompanyModal } from "./JoinCompanyModal";

// ─── Liste des entreprises existantes ────────────────────────────────────────
function BusinessesSection() {
  const { businesses, refreshBusinesses, switchBusiness } = useBusiness();
  const navigate = useNavigate();

  useEffect(() => {
    refreshBusinesses();
  }, []);

  if (businesses.length === 0) return null;

  return (
    <div className="mt-12 w-full max-w-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-border" />
        <p className="text-sm font-semibold text-muted-foreground px-2">
          Vos entreprises existantes
        </p>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-3">
        {businesses.map((b) => (
          <div key={b.id} className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-3 hover:shadow-md hover:border-blue-200 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">{b.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.your_role ?? "Membre"}</p>
              </div>
            </div>
            <button
              data-cy="business-enter"
              onClick={async () => { await switchBusiness(b.id); navigate("/app"); }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Entrer
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function BusinessOnboarding() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<"create" | "join" | null>(null);
  const [joinOpen, setJoinOpen] = useState(false); // ✅ ici dans le bon composant

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-primary" />
          <span className="font-semibold text-lg text-foreground">Business Management</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <button
              onClick={() => navigate("/profile/edit")}
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-blue-50 transition-colors duration-150 group"
              title="Modifier mon profil"
            >
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user.firstname} {user.lastname}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{user.firstname?.[0]}{user.lastname?.[0]}</span>
                </div>
              </div>
            </button>
          )}
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition px-3 py-1.5 rounded-lg hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </nav>

      <div className="flex flex-col items-center justify-center px-4 pt-16 pb-20">
        <div className="text-center mb-12 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            <CheckCircle className="h-4 w-4" />
            Connexion réussie
          </div>
          <p className="text-lg text-muted-foreground">Pour commencer, rejoignez une entreprise existante ou créez la vôtre.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">

          {/* Create */}
          <button
            onMouseEnter={() => setHovered("create")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate("/businesses/new")}
            className={`group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all duration-200 bg-white ${hovered === "create" ? "border-blue-500 shadow-xl shadow-blue-100 -translate-y-1" : "border-border shadow-sm hover:shadow-md"}`}
          >
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-200 ${hovered === "create" ? "bg-blue-600" : "bg-blue-50"}`}>
              <Building2 className={`h-8 w-8 transition-colors duration-200 ${hovered === "create" ? "text-white" : "text-blue-600"}`} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Créer une entreprise</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">Lancez votre espace de travail. Vous serez automatiquement propriétaire et pourrez inviter votre équipe.</p>
            <ul className="text-left w-full space-y-2 mb-6">
              {["Accès complet à toutes les fonctionnalités", "Invitez des membres et gérez les rôles", "Configurez vos paramètres de facturation"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />{item}
                </li>
              ))}
            </ul>
            <div className={`flex items-center gap-2 font-semibold text-sm transition-colors duration-200 ${hovered === "create" ? "text-blue-600" : "text-muted-foreground"}`}>
              Créer mon entreprise
              <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${hovered === "create" ? "translate-x-1" : ""}`} />
            </div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Recommandé</span>
            </div>
          </button>

          {/* Join */}
          <button
            onMouseEnter={() => setHovered("join")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setJoinOpen(true)}
            className={`group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all duration-200 bg-white ${hovered === "join" ? "border-indigo-500 shadow-xl shadow-indigo-100 -translate-y-1" : "border-border shadow-sm hover:shadow-md"}`}
          >
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-200 ${hovered === "join" ? "bg-indigo-600" : "bg-indigo-50"}`}>
              <Users className={`h-8 w-8 transition-colors duration-200 ${hovered === "join" ? "text-white" : "text-indigo-600"}`} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Rejoindre une entreprise</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">Vous avez reçu une invitation ? Entrez votre code ou acceptez l'invitation envoyée par email.</p>
            <ul className="text-left w-full space-y-2 mb-6">
              {["Acceptez une invitation par email", "Entrez un code d'invitation", "Accédez à l'espace de votre équipe"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />{item}
                </li>
              ))}
            </ul>
            <div className={`flex items-center gap-2 font-semibold text-sm transition-colors duration-200 ${hovered === "join" ? "text-indigo-600" : "text-muted-foreground"}`}>
              Rejoindre avec un code
              <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${hovered === "join" ? "translate-x-1" : ""}`} />
            </div>
          </button>
        </div>

        <BusinessesSection />
      </div>

      {/* ✅ Modal dans le bon composant */}
      {joinOpen && <JoinCompanyModal onClose={() => setJoinOpen(false)} />}
    </div>
  );
}