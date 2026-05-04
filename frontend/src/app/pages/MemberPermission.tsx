// ─────────────────────────────────────────────────────────────
// MembersPermissions.tsx  (React)
//
// Flow :
//  1. Affiche la liste des membres (comme Members.tsx existant)
//  2. Owner clique sur un membre → slide-in panel à droite
//  3. Panel affiche le rôle du membre + toutes les permissions
//     avec toggle ON/OFF par rôle
//  4. Save → PUT /roles/:roleId/permissions
//
// ⚠️  Les permissions sont sur le RÔLE, pas sur la personne.
//     Tous les membres du même rôle partagent les mêmes permissions.
//     (adapté à ton schéma actuel sans migration)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Users, ChevronRight, X, Shield, Save, Loader2 } from "lucide-react";
import { useBusiness } from "@/app/context/BusinessContext";
import { toast } from "sonner";

const API_URL = "http://localhost:3001/api";

// ── Types ──────────────────────────────────────────────────────
interface Member {
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  role_id: number;
  joined_at: string;
}

interface Permission {
  id: number;
  action: string;
}

interface RolePermissionsData {
  roleId: number;
  roleTitle: string;
  permissions: Permission[];
}

// ── Labels lisibles pour chaque action ────────────────────────
const PERMISSION_LABELS: Record<string, { label: string; description: string; category: string }> = {
  "invoices":  { label: "Facturation",        description: "Factures, avoirs, bons de livraison, devis clients", category: "Ventes"  },
  "quotes":    { label: "Devis & commandes",  description: "Devis, bons de commande clients",                   category: "Ventes"  },
  "clients":   { label: "Clients",            description: "Consulter et gérer les clients",                    category: "Ventes"  },
  "expenses":  { label: "Dépenses",           description: "Dépenses et bons de commande fournisseurs",         category: "Achats"  },
  "products":  { label: "Produits & stock",   description: "Catalogue, entrepôts, niveaux de stock, imports",  category: "Stock"   },
  "banks":     { label: "Banques",            description: "Comptes bancaires et transactions",                 category: "Finance" },
  "employees": { label: "Employés",           description: "Fiches employés et gestion RH",                    category: "RH"      },
  "members":   { label: "Membres & rôles",    description: "Inviter des membres et gérer leurs permissions",   category: "Admin"   },
};

const getFallbackLabel = (action: string) => ({
  label: action,
  description: action,
  category: "Autre",
});

// ── Composant principal ────────────────────────────────────────
const MembersPermissions = () => {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;

  const [members, setMembers] = useState<Member[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsData | null>(null);
  const [activeIds, setActiveIds] = useState<Set<number>>(new Set());
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [saving, setSaving] = useState(false);

  // Charger membres + toutes les permissions au montage
  useEffect(() => {
    if (!businessId) return;
    fetchMembers();
    fetchAllPermissions();
  }, [businessId]);

  const togglePermission = (permId: number) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });
  };
  // Remplace les deux fonctions fetch par ceci :

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  // ou selon comment tu stockes le token dans ton app :
  // 'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
});

const fetchMembers = async () => {
  try {
    const res = await fetch(`${API_URL}/businesses/${businessId}/member`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    setMembers(Array.isArray(data) ? data : []);
  } catch {
    toast.error("Erreur lors du chargement des membres");
  } finally {
    setLoadingMembers(false);
  }
};

const fetchAllPermissions = async () => {
  if (!businessId) return;
  try {
    const res = await fetch(`${API_URL}/businesses/${businessId}/permissions`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    setAllPermissions(Array.isArray(data) ? data : []);
  } catch {
    console.error("Erreur chargement permissions");
  }
};

const openMemberPanel = async (member: Member) => {
    console.log(member);
     console.log(member.role_id);
  if (!member.role_id) {
    
    toast.error("Ce membre n'a pas de rôle assigné");
    return;
  }
  setSelectedMember(member);
  setLoadingPanel(true);
  try {
    const res = await fetch(
      `${API_URL}/businesses/${businessId}/roles/${member.role_id}/permissions`,
      { headers: getAuthHeaders() }
    );
    const data: RolePermissionsData = await res.json();
    setRolePermissions(data);
    setActiveIds(new Set(data.permissions.map((p) => p.id)));
  } catch {
    toast.error("Erreur lors du chargement des permissions");
  } finally {
    setLoadingPanel(false);
  }
};

const savePermissions = async () => {
  if (!selectedMember || !rolePermissions) return;
  setSaving(true);
  try {
    const res = await fetch(
      `${API_URL}/businesses/${businessId}/roles/${rolePermissions.roleId}/permissions`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissionIds: Array.from(activeIds) }),
      }
    );
    if (!res.ok) throw new Error();
    toast.success(`Permissions du rôle "${rolePermissions.roleTitle}" mises à jour`);
  } catch {
    toast.error("Erreur lors de la sauvegarde");
  } finally {
    setSaving(false);
  }
};

  // Regrouper les permissions par catégorie
  const grouped = allPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const info = PERMISSION_LABELS[perm.action] ?? getFallbackLabel(perm.action);
    if (!acc[info.category]) acc[info.category] = [];
    acc[info.category].push(perm);
    return acc;
  }, {});

  if (loadingMembers) return <div className="p-6 text-muted-foreground">Chargement...</div>;

  return (
    <div className="flex gap-6 h-full">
      {/* ── Liste des membres ─────────────────────────────────── */}
      <div className={`transition-all duration-300 ${selectedMember ? "w-1/2" : "w-full"}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Permissions des membres</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Cliquez sur un membre pour gérer les permissions de son rôle
              </p>
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">{members.length} membre(s)</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {members.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Aucun membre</p>
                </div>
              ) : (
                <div className="divide-y">
                  {members.map((member) => {
                    const isSelected = selectedMember?.user_id === member.user_id;
                    return (
                      <button
                        key={member.user_id}
                        onClick={() => openMemberPanel(member)}
                        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors
                          ${isSelected
                            ? "bg-primary/5 border-l-4 border-primary"
                            : "hover:bg-muted/50 border-l-4 border-transparent"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <span className="text-white text-sm font-semibold">
                              {member.firstname?.[0]}{member.lastname?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {member.firstname} {member.lastname}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5 font-medium">
                            {member.role || "—"}
                          </span>
                          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Panel permissions ─────────────────────────────────── */}
      {selectedMember && (
        <div className="w-1/2 animate-in slide-in-from-right duration-200">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {selectedMember.firstname?.[0]}{selectedMember.lastname?.[0]}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {selectedMember.firstname} {selectedMember.lastname}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Rôle :{" "}
                      <span className="font-medium text-foreground">
                        {rolePermissions?.roleTitle ?? selectedMember.role}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={savePermissions}
                    disabled={saving || loadingPanel}
                    className="gap-1.5"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Sauvegarder
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSelectedMember(null)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Avertissement rôle partagé */}
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                <Shield className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  Ces permissions s'appliquent à <strong>tous les membres</strong> avec le rôle{" "}
                  <strong>{rolePermissions?.roleTitle}</strong>.
                </p>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto py-4">
              {loadingPanel ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Chargement...</span>
                </div>
              ) : allPermissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucune permission trouvée</p>
                  <p className="text-xs mt-1">Ajoutez des entrées dans la table `permissions`</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([category, perms]) => (
                    <div key={category}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {perms.map((perm) => {
                          const info = PERMISSION_LABELS[perm.action] ?? getFallbackLabel(perm.action);
                          const isActive = activeIds.has(perm.id);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-all
                                ${isActive
                                  ? "bg-primary/5 border-primary/30"
                                  : "bg-muted/30 border-border/50 opacity-60 hover:opacity-80"
                                }`}
                            >
                              <div>
                                <p className="text-sm font-medium">{info.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {info.description}
                                </p>
                              </div>
                              {/* Toggle switch */}
                              <div
                                className={`relative w-10 h-5 rounded-full transition-colors shrink-0
                                  ${isActive ? "bg-primary" : "bg-muted-foreground/30"}`}
                              >
                                <div
                                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform
                                    ${isActive ? "translate-x-5" : "translate-x-0.5"}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MembersPermissions;