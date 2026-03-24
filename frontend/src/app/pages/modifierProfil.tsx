import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    ArrowLeft,
    BarChart3,
    User,
    Mail,
    Lock,
    AlertCircle,

} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

// ─── Types ─────────────────────────────────────────────
interface ProfileForm {
    firstname: string;
    lastname: string;
    email: string;
}

interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

function InputField({
    label,
    icon: Icon,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
    rightElement,
    disabled,
}: {
    label: string;
    icon: React.ElementType;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
    rightElement?: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{label}</label>
            <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition ${error
                        ? "border-red-400 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                        }`}
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" /> {error}
                </p>
            )}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────
export default function EditProfile() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    // ── Profile State ──
    const [profile, setProfile] = useState<ProfileForm>({
        firstname: "",
        lastname: "",
        email: "",
    });

    const [profileErrors, setProfileErrors] = useState<Partial<ProfileForm>>({});
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    // ── Password State ──
    const [passwords, setPasswords] = useState<PasswordForm>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordForm>>({});
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ── Avatar ──
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    

    // ── Sync user → profile form ──
    useEffect(() => {
        if (user) {
            setProfile({
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            });
        }
    }, [user]);

    // ── Validation ──
    function validateProfile(): boolean {
        const errs: Partial<ProfileForm> = {};

        if (!profile.firstname.trim()) errs.firstname = "Le prénom est requis.";
        if (!profile.lastname.trim()) errs.lastname = "Le nom est requis.";
        if (!profile.email.trim()) errs.email = "Email requis.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
            errs.email = "Format invalide.";

        setProfileErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function validatePasswords(): boolean {
        const errs: Partial<PasswordForm> = {};

        if (!passwords.currentPassword) errs.currentPassword = "Requis.";
        if (!passwords.newPassword) errs.newPassword = "Requis.";
        else if (passwords.newPassword.length < 8)
            errs.newPassword = "Minimum 8 caractères.";

        if (passwords.newPassword !== passwords.confirmPassword)
            errs.confirmPassword = "Ne correspond pas.";

        setPasswordErrors(errs);
        return Object.keys(errs).length === 0;
    }

    // ── Handlers ──
    async function handleSaveProfile() {
        if (!validateProfile() || !user) return;

        setProfileLoading(true);
        try {
            const res = await api.patch("/users/update-profile", profile);

            updateUser(res.data); 

            toast.success("✅ Profil mis à jour avec succès", {
                autoClose: 2000,
               
            });

            // Refresh page after toast disappears
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch {
            setProfileErrors({ email: "Erreur lors de la mise à jour." });
        } finally {
            setProfileLoading(false);
        }
    }

    async function handleChangePassword() {
        if (!validatePasswords()) return;

        setPasswordLoading(true);
        try {
            console.log("oldPassword:", passwords.currentPassword);
            console.log("user.password:", passwords.newPassword);
            await api.patch("/users/change-password", {
                oldPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            toast.success("✅ Mot de passe mis à jour !");
            setPasswordSuccess(true);
            setPasswords({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch {
            setPasswordErrors({
                currentPassword: "Mot de passe incorrect.",
            });
        } finally {
            setPasswordLoading(false);
        }
    }
    const initials = `${user?.firstname?.[0] ?? ""}${user?.lastname?.[0] ?? ""}`.toUpperCase();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="w-full px-6 py-4 flex items-center justify-between bg-white border-b">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold text-lg">Business Management</span>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-black"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                </button>
            </nav>

            <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">

                {/* Avatar */}
                <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center gap-6">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                            {avatarPreview ? (
                                <img src={avatarPreview} className="h-full w-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>

                    </div>

                    <div>
                        <p className="font-semibold">
                            {user?.firstname} {user?.lastname}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                    <h2 className="font-semibold text-lg">Informations personnelles</h2>

                    <InputField
                        label="Prénom"
                        icon={User}
                        value={profile.firstname}
                        onChange={(v) => setProfile({ ...profile, firstname: v })}
                        error={profileErrors.firstname}
                    />

                    <InputField
                        label="Nom"
                        icon={User}
                        value={profile.lastname}
                        onChange={(v) => setProfile({ ...profile, lastname: v })}
                        error={profileErrors.lastname}
                    />

                    <InputField
                        label="Email"
                        icon={Mail}
                        value={profile.email}
                        onChange={(v) => setProfile({ ...profile, email: v })}
                        error={profileErrors.email}
                    />

                    {profileSuccess && (
                        <div className="text-green-600 text-sm">
                            Profil mis à jour avec succès
                        </div>
                    )}

                    <button
                        onClick={handleSaveProfile}
                        disabled={profileLoading}
                        className="bg-blue-600 text-white px-5 py-2 rounded-xl self-end"
                    >
                        {profileLoading ? "Enregistrement..." : "Enregistrer"}
                    </button>
                </div>

                {/* Password Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                    <h2 className="font-semibold text-lg">Changer mot de passe</h2>

                    <InputField
                        label="Mot de passe actuel"
                        icon={Lock}
                        type={showCurrent ? "text" : "password"}
                        value={passwords.currentPassword}
                        onChange={(v) =>
                            setPasswords({ ...passwords, currentPassword: v })
                        }
                        error={passwordErrors.currentPassword}
                    />

                    <InputField
                        label="Nouveau mot de passe"
                        icon={Lock}
                        type={showNew ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={(v) => setPasswords({ ...passwords, newPassword: v })}
                        error={passwordErrors.newPassword}
                    />

                    <InputField
                        label="Confirmer"
                        icon={Lock}
                        type={showConfirm ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={(v) =>
                            setPasswords({ ...passwords, confirmPassword: v })
                        }
                        error={passwordErrors.confirmPassword}
                    />

                    {passwordSuccess && (
                        <div className="text-green-600 text-sm">
                            Mot de passe mis à jour
                        </div>
                    )}

                    <button
                        onClick={handleChangePassword}
                        disabled={passwordLoading}
                        className="bg-blue-600 text-white px-5 py-2 rounded-xl self-end"
                    >
                        {passwordLoading ? "Mise à jour..." : "Mettre à jour"}
                    </button>
                </div>
            </div>
        </div>
    );
}