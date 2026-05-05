import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { UserPlus, Trash2, Users } from "lucide-react";
import { useBusiness } from "@/app/context/BusinessContext";

const API_URL = "/api";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const Members = () => {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id;

  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (businessId) {
      fetchMembers();
    }
  }, [businessId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/businesses/${businessId}/members`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching members:", error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!email || !roleId || !businessId) return;

    try {
      const response = await fetch(
        `${API_URL}/businesses/${businessId}/invite`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            email,
            role_id: parseInt(roleId),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Invitation envoyée");
        setEmail("");
        setRoleId("");
        fetchMembers();
      } else {
        setMessage(data.message || "Erreur lors de l'invitation");
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      setMessage("Erreur serveur");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  const handleRemove = async (userId) => {
    if (!businessId) return;

    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) return;

    try {
      const response = await fetch(
        `${API_URL}/businesses/${businessId}/members/${userId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

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
          <h1 className="text-2xl font-bold">Gestion des Membres</h1>
          <p className="text-muted-foreground">
            Invitez et gérez les membres de votre entreprise
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
          <Users className="h-5 w-5" />
          <span>{members.length} membre(s)</span>
        </div>
      </div>

      {/* Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter un utilisateur
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Rôle</Label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Choisir</option>
                <option value="1">Business Administrator</option>
                <option value="2">Accountant</option>
                <option value="3">Team Member</option>
              </select>
            </div>

            <Button onClick={handleInvite}>
              <UserPlus className="mr-2 h-4 w-4" />
              Inviter
            </Button>
          </div>

          {message && <p className="mt-3">{message}</p>}
        </CardContent>
      </Card>

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle>Membres</CardTitle>
        </CardHeader>

        <CardContent>
          {members.length === 0 ? (
            <p>Aucun membre</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {members.map((m) => (
                  <tr key={m.user_id}>
                    <td>{m.firstname} {m.lastname}</td>
                    <td>{m.email}</td>
                    <td>{m.role || "-"}</td>
                    <td>
                      {m.joined_at
                        ? new Date(m.joined_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        onClick={() => handleRemove(m.user_id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;