import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstname: "",
    lastname: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [backendError, setBackendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const submit = async () => {
    setErrors({});
    setBackendError(null);

    // Validation frontend
    const newErrors: { [key: string]: string } = {};
    if (!form.firstname) newErrors.firstname = "Prénom requis";
    if (!form.lastname) newErrors.lastname = "Nom requis";
    if (!form.email) newErrors.email = "Email requis";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Email invalide";
    if (!form.password) newErrors.password = "Mot de passe requis";
    else if (form.password.length < 6) newErrors.password = "Mot de passe min 6 caractères";
    if (!form.confirmPassword) newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
        const { confirmPassword, ...data } = form;
      await api.post("/users/register", data);
      toast.success("Inscription réussie ! Vérifiez votre email.", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => navigate("/login"), 3001);
      setForm({
        email: "",
        password: "",
        confirmPassword: "",
        firstname: "",
        lastname: "",
        phoneNumber: "",
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setBackendError("Cet email existe déjà");
      } else {
        setBackendError("Erreur inconnue, réessayez plus tard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <ToastContainer />
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Inscription</h2>

        {backendError && (
          <p className="bg-red-100 text-red-700 p-2 mb-4 rounded text-center">
            {backendError}
          </p>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <input
              name="firstname"
              placeholder="Prénom"
              value={form.firstname}
              onChange={handleChange}
              className={`px-4 py-3 border rounded-lg w-full focus:outline-none focus:ring-2 transition ${
                errors.firstname ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.firstname && <p className="text-red-500 text-sm mt-1">{errors.firstname}</p>}
          </div>

          <div>
            <input
              name="lastname"
              placeholder="Nom"
              value={form.lastname}
              onChange={handleChange}
              className={`px-4 py-3 border rounded-lg w-full focus:outline-none focus:ring-2 transition ${
                errors.lastname ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.lastname && <p className="text-red-500 text-sm mt-1">{errors.lastname}</p>}
          </div>

          <div>
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className={`px-4 py-3 border rounded-lg w-full focus:outline-none focus:ring-2 transition ${
                errors.email ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              name="password"
              type="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={handleChange}
              className={`px-4 py-3 border rounded-lg w-full focus:outline-none focus:ring-2 transition ${
                errors.password ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirmer le mot de passe"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`px-4 py-3 border rounded-lg w-full focus:outline-none focus:ring-2 transition ${
                errors.confirmPassword ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <div>
            <input
              name="phoneNumber"
              placeholder="Téléphone (optionnel)"
              value={form.phoneNumber}
              onChange={handleChange}
              className="px-4 py-3 border rounded-lg w-full focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-400 transition"
            />
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Déjà un compte ?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Se connecter
          </a>
          <br />
          <a href="/" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Retour à l’accueil
          </a>
        </div>
      </div>
    </div>
  );
}