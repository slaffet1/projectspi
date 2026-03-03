import { useEffect, useState } from "react";
import { api } from "@/app/services/api";
import { Button } from "@/app/components/ui/button";

export function ApproveModal({ request, onClose }) {
  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    api.get("/user-management/roles")
      .then(res => setRoles(res.data));
  }, []);

  const submit = async () => {
    await api.post("/user-management/approve-request", {
      requestId: request.id,
      roleId: Number(roleId),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-96">
        <h2 className="text-lg font-semibold mb-4">
          Choisir un rôle
        </h2>

        <select
          className="w-full border p-2 rounded mb-4"
          onChange={(e) => setRoleId(e.target.value)}
        >
          <option value="">Sélectionner un rôle</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.title}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit}>
            Valider
          </Button>
        </div>
      </div>
    </div>
  );
}