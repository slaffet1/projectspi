import { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twofaCode, setTwofaCode] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; twofaCode?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const submitCredentials = async () => {
    setErrors({});
    setAuthError(null);

    // Validate input
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email requis";
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Email invalide";
    if (!password) newErrors.password = "Mot de passe requis";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/users/login", { email, password });

      if (res.data.requires2FA) {
        // 2FA is required
        setUserId(res.data.userId);
        setRequires2FA(true);
        toast.info("Veuillez entrer votre code 2FA");
      } else {
        // Normal login
        login(res.data.access_token);
        navigate("/onboarding");
      }
    } catch (err: any) {
      if (err.response?.status === 401) setAuthError("Email ou mot de passe incorrect");
      else setAuthError("Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const submit2FA = async () => {
    if (!twofaCode) {
      setErrors({ twofaCode: "Code requis" });
      return;
    }
    if (!userId) return;

    setLoading(true);
    try {
      const res = await api.post("/users/verify-2fa", {
        userId,
        code: twofaCode,
      });

      login(res.data.access_token);
      navigate("/onboarding");
    } catch (err: any) {
      setErrors({ twofaCode: "Code 2FA invalide" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Connexion
        </h2>

        {authError && (
          <p className="bg-red-100 text-red-700 p-2 mb-4 rounded text-center">
            {authError}
          </p>
        )}

        <div className="flex flex-col gap-4">
          {!requires2FA ? (
            <>
              {/* Email */}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`px-4 py-3 border rounded-lg w-full focus:outline-none focus:ring-2 transition ${errors.email ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
                  }`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}

              {/* Password */}
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`px-4 py-3 border rounded-lg w-full focus:outline-none focus:ring-2 transition ${errors.password ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
                  }`}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}

              <button
                onClick={submitCredentials}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </>
          ) : (
            <>
              {/* 2FA Input */}
              <input
                type="text"
                placeholder="Code 2FA"
                value={twofaCode}
                onChange={(e) => setTwofaCode(e.target.value)}
                className={`px-4 py-3 border rounded-lg w-full focus:outline-none focus:ring-2 transition ${errors.twofaCode ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
                  }`}
              />
              {errors.twofaCode && <p className="text-red-500 text-sm mt-1">{errors.twofaCode}</p>}

              <button
                onClick={submit2FA}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Vérification..." : "Vérifier le code"}
              </button>
            </>
          )}
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          Pas de compte ?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Créer un compte
          </a>
          <br />
          <a href="/" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}