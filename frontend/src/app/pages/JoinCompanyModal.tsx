import { useState } from "react";
import { api } from "@/app/services/api";

interface Props {
  onClose: () => void;
}

export function JoinCompanyModal({ onClose }: Props) {
  const [matricule, setMatricule] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!matricule) {
      setError("Matricule requis");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post("/user-management/join-company", {
        matricule_fiscale: matricule,
      });

      alert("Demande envoyée avec succès !");
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors de l'envoi"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4">
          Rejoindre une entreprise
        </h2>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 mb-4 rounded">
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Matricule fiscale"
          value={matricule}
          onChange={(e) => setMatricule(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-primary"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Annuler
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}