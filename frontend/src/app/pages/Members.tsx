import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { UserPlus, Trash2, Users } from "lucide-react";
import { useBusiness } from "@/app/context/BusinessContext";


const API_URL = "http://charikty.swedencentral.cloudapp.azure.com/apicharikty.swedencentral.cloudapp.azure.com/api";

const Members = () => {
  // ✅ Hook à l'intérieur du composant
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;

  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_URL}/businesses/${businessId}/members`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setMembers(data);
      } else {
        setMembers([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching members:", error);
      setMembers([]);
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!email || !roleId) return;

    try {
      const response = await fetch(`${API_URL}/businesses/${businessId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role_id: parseInt(roleId),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail("");
        setRoleId("");
        fetchMembers();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Erreur lors de l'invitation");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      setMessage("Erreur de connexion au serveur");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) return;

    try {
      const response = await fetch(`${API_URL}/businesses/${businessId}/members/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Membres</h1>
          <p className="text-muted-foreground">
            Invitez et gérez les membres de votre entreprise
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{members.length} membre(s)</span>
        </div>
      </div>

      {/* Formulaire d'invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter un utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Email de l'utilisateur</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
              />
            </div>
            <div>
              <Label>Rôle</Label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="">Sélectionner un rôle</option>
                <option value="1">Business Administrator</option>
                <option value="2">Accountant</option>
                <option value="3">Team Member</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleInvite} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Inviter
              </Button>
            </div>
          </div>
          {message && (
            <div className="mt-4 p-3 rounded-lg bg-muted text-sm font-medium">
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <CardTitle>Membres actuels</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun membre pour le moment</p>
              <p className="text-sm">Invitez des utilisateurs pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nom</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rôle</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date d'ajout</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.user_id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {member.firstname?.[0]}{member.lastname?.[0]}
                            </span>
                          </div>
                          <span className="font-medium">
                            {member.firstname} {member.lastname}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{member.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {member.role || "Non défini"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString("fr-FR")
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(member.user_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;