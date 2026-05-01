import { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, Shield, ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twofaCode, setTwofaCode] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; twofaCode?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const submitCredentials = async () => {
    setErrors({});
    setAuthError(null);

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
        setUserId(res.data.userId);
        setRequires2FA(true);
        toast.info("Veuillez entrer votre code 2FA", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
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
      const res = await api.post("/users/verify-2fa", { userId, code: twofaCode });
      login(res.data.access_token);
      navigate("/onboarding");
    } catch (err: any) {
      setErrors({ twofaCode: "Code 2FA invalide" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <main className="max-w-md w-full">
        {/* Card avec effet glassmorphisme et animation */}
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/20 transition-all duration-300 hover:shadow-3xl">

          {/* Logo ou icône */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Titre */}
          <h1
            id="login-title"
            className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2"
          >
            Bienvenue
          </h1>
          <p className="text-center text-gray-500 mb-8">
            Connectez-vous à votre compte
          </p>

          {/* Message d'erreur global */}
          {authError && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg animate-shake"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{authError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-5">
            {!requires2FA ? (
              <>
                {/* Champ Email */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-gray-500" />
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <input
                      data-cy="email-input"
                      id="email"
                      type="email"
                      placeholder="exemple@domaine.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      autoComplete="email"
                      className={`w-full px-4 py-3 pl-11 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 hover:border-gray-400"
                        }`}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.email && (
                    <p
                      id="email-error"
                      role="alert"
                      className="text-red-500 text-sm flex items-center gap-1 animate-fadeIn"
                    >
                      <span>⚠️</span> {errors.email}
                    </p>
                  )}
                </div>

                {/* Champ Mot de passe */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-gray-500" />
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      data-cy="password-input"
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      autoComplete="current-password"
                      className={`w-full px-4 py-3 pl-11 pr-12 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300 hover:border-gray-400"
                        }`}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p
                      id="password-error"
                      role="alert"
                      className="text-red-500 text-sm flex items-center gap-1 animate-fadeIn"
                    >
                      <span>⚠️</span> {errors.password}
                    </p>
                  )}
                </div>

                {/* Lien mot de passe oublié */}
                <div className="text-right">
                  <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    Mot de passe oublié ?
                  </a>
                </div>

                {/* Bouton de connexion */}
                <button
                  data-cy="login-submit"
                  type="button"
                  onClick={submitCredentials}
                  disabled={loading}
                  aria-busy={loading}
                  className="relative mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connexion en cours...
                    </div>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Champ 2FA */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="twofa-code"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-gray-500" />
                    Code d'authentification à deux facteurs
                  </label>
                  <div className="relative">
                    <input
                      data-cy="otp-input"
                      id="twofa-code"
                      type="text"
                      inputMode="numeric"
                      placeholder="123456"
                      value={twofaCode}
                      onChange={(e) => setTwofaCode(e.target.value)}
                      aria-invalid={!!errors.twofaCode}
                      aria-describedby={errors.twofaCode ? "twofa-error" : undefined}
                      autoComplete="one-time-code"
                      className="w-full px-4 py-3 text-center text-2xl tracking-widest rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      maxLength={6}
                    />
                  </div>
                  {errors.twofaCode && (
                    <p
                      id="twofa-error"
                      role="alert"
                      className="text-red-500 text-sm flex items-center gap-1 justify-center animate-fadeIn"
                    >
                      <span>⚠️</span> {errors.twofaCode}
                    </p>
                  )}
                </div>

                {/* Bouton de vérification 2FA */}
                <button
                  data-cy="otp-submit"
                  type="button"
                  onClick={submit2FA}
                  disabled={loading}
                  aria-busy={loading}
                  className="relative mt-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Vérification en cours...
                    </div>
                  ) : (
                    "Vérifier le code"
                  )}
                </button>
              </>
            )}
          </div>

          {/* Liens secondaires */}
          <nav aria-label="Liens secondaires" className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Pas de compte ?{" "}
                <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                  Créer un compte gratuitement
                </a>
              </p>
              <p>
                <a href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors group">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Retour à l'accueil
                </a>
              </p>
            </div>
          </nav>
        </div>

        {/* Badge de sécurité */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Connexion sécurisée • Vos données sont protégées
          </p>
        </div>
      </main>

      {/* Animations CSS personnalisées */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}