import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Mail, Lock, User, Phone, Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <ToastContainer />
      <main className="max-w-lg w-full">
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl p-6 border border-white/20 transition-all duration-300 hover:shadow-3xl">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
            Inscription
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            Créez votre compte gratuitement
          </p>

          {backendError && (
            <div role="alert" aria-live="assertive" className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-5 rounded-lg animate-shake">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{backendError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="firstname" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-500" />
                  Prénom
                </label>
                <div className="relative">
                  <input
                    id="firstname"
                    name="firstname"
                    type="text"
                    placeholder="flen"
                    value={form.firstname}
                    onChange={handleChange}
                    aria-invalid={!!errors.firstname}
                    className={`w-full px-3 py-2 pl-8 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.firstname ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  />
                  <User className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                </div>
                {errors.firstname && (
                  <p role="alert" className="text-red-500 text-xs flex items-center gap-1 animate-fadeIn">
                    <span>⚠️</span> {errors.firstname}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="lastname" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-500" />
                  Nom
                </label>
                <div className="relative">
                  <input
                    id="lastname"
                    name="lastname"
                    type="text"
                    placeholder="ben foulen"
                    value={form.lastname}
                    onChange={handleChange}
                    aria-invalid={!!errors.lastname}
                    className={`w-full px-3 py-2 pl-8 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastname ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  />
                  <User className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                </div>
                {errors.lastname && (
                  <p role="alert" className="text-red-500 text-xs flex items-center gap-1 animate-fadeIn">
                    <span>⚠️</span> {errors.lastname}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Mail className="w-3 h-3 text-gray-500" />
                Adresse e-mail
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="exemple@domaine.com"
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={!!errors.email}
                  className={`w-full px-3 py-2 pl-8 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                />
                <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
              {errors.email && (
                <p role="alert" className="text-red-500 text-xs flex items-center gap-1 animate-fadeIn">
                  <span>⚠️</span> {errors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-gray-500" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={!!errors.password}
                  className={`w-full px-3 py-2 pl-8 pr-8 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                />
                <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="text-red-500 text-xs flex items-center gap-1 animate-fadeIn">
                  <span>⚠️</span> {errors.password}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Lock className="w-3 h-3 text-gray-500" />
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  aria-invalid={!!errors.confirmPassword}
                  className={`w-full px-3 py-2 pl-8 pr-8 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                />
                <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p role="alert" className="text-red-500 text-xs flex items-center gap-1 animate-fadeIn">
                  <span>⚠️</span> {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="phoneNumber" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Phone className="w-3 h-3 text-gray-500" />
                Téléphone (optionnel)
              </label>
              <div className="relative">
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+216 12345678"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pl-8 text-sm rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="relative mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-lg text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Inscription...
                </div>
              ) : (
                "S'inscrire"
              )}
            </button>
          </div>

          <nav aria-label="Liens secondaires" className="mt-5 pt-4 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-600">
                Déjà un compte ?{" "}
                <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                  Se connecter
                </a>
              </p>
              <p>
                <a href="/" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors group">
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                  Retour à l'accueil
                </a>
              </p>
            </div>
          </nav>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Inscription sécurisée • Vos données sont protégées
          </p>
        </div>
      </main>

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