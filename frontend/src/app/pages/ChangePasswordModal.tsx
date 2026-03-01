import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/app/services/api"; 

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ChangePasswordModal({ isOpen, onClose }: Props) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async () => {
    setErrors({});

    
    const newErrors: { [key: string]: string } = {};
    if (!form.oldPassword) newErrors.oldPassword = "Veuillez saisir l'ancien mot de passe";
    if (!form.newPassword) newErrors.newPassword = "Veuillez saisir le nouveau mot de passe";
    else if (form.newPassword.length < 6) newErrors.newPassword = "Minimum 6 caractères";
    if (!form.confirmPassword) newErrors.confirmPassword = "Veuillez confirmer le mot de passe";
    else if (form.newPassword !== form.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await api.patch("/users/change-password", {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      toast.success("✅ Mot de passe mis à jour !");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      onClose();
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("❌ Ancien mot de passe incorrect");
      } else {
        toast.error("❌ Ancien mot de passe incorrect");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold mb-4">Changer le mot de passe</h2>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <div className="flex flex-col gap-4">
     
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              name="oldPassword"
              placeholder="Ancien mot de passe"
              value={form.oldPassword}
              onChange={handleChange}
              className={`px-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${
                errors.oldPassword ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showOld ? "🙈" : "👁️"}
            </button>
            {errors.oldPassword && <p className="text-red-500 text-sm">{errors.oldPassword}</p>}
          </div>

    
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              name="newPassword"
              placeholder="Nouveau mot de passe"
              value={form.newPassword}
              onChange={handleChange}
              className={`px-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${
                errors.newPassword ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showNew ? "🙈" : "👁️"}
            </button>
            {errors.newPassword && <p className="text-red-500 text-sm">{errors.newPassword}</p>}
          </div>

      
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirmer le nouveau mot de passe"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`px-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${
                errors.confirmPassword ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? "🙈" : "👁️"}
            </button>
            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary hover:bg-accent text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? "En cours..." : "Changer le mot de passe"}
          </button>
        </div>
      </div>
    </div>
  );
}