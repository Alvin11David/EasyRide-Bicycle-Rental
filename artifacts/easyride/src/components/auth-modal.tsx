import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Check,
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import type { EasyRideStation } from "@workspace/api-client-react";
import { useAuth, type EasyRideUser, type UserRole, DEFAULT_USERS } from "@/hooks/use-auth";

interface AuthProps {
  initialMode?: "signin" | "signup";
  initialRole?: UserRole;
  stations?: EasyRideStation[];
  auth?: ReturnType<typeof useAuth>;
  onSuccess?: (user: EasyRideUser) => void;
  onClose?: () => void;
}

export function AuthCard({
  initialMode = "signin",
  initialRole = "rider",
  stations = [],
  auth: propAuth,
  onSuccess,
  onClose,
}: AuthProps) {
  const localAuth = useAuth();
  const { signin, signup, quickDemoLogin } = propAuth || localAuth;
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpStationId, setSignUpStationId] = useState(
    stations[0]?.id || "station-makerere-main"
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const result = signin(signInEmail, signInPassword);
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      setErrorMessage(result.error || "Failed to sign in. Please verify your credentials.");
      return;
    }

    setSuccessMessage(`Welcome back, ${result.user.name}! Redirecting...`);
    setTimeout(() => {
      onSuccess?.(result.user!);
    }, 200);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (signUpPassword && signUpConfirmPassword && signUpPassword !== signUpConfirmPassword) {
      setErrorMessage("Passwords do not match. Please re-check.");
      return;
    }

    setIsSubmitting(true);
    const result = signup({
      name: signUpName,
      email: signUpEmail,
      phone: signUpPhone,
      password: signUpPassword || "password123",
      role: selectedRole,
      stationId: selectedRole === "staff" ? signUpStationId : undefined,
    });
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      setErrorMessage(result.error || "Failed to create account. Please check your inputs.");
      return;
    }

    setSuccessMessage(`Account created for ${result.user.name}! Redirecting to dashboard...`);
    setTimeout(() => {
      onSuccess?.(result.user!);
    }, 200);
  };

  const handleDemoLogin = (role: UserRole) => {
    setErrorMessage(null);
    const user = quickDemoLogin(role);
    if (user) {
      setSuccessMessage(`Signed in as ${user.name} (${role === "staff" ? "Staff" : "Rider"})! Redirecting...`);
      setTimeout(() => {
        onSuccess?.(user);
      }, 200);
    }
  };

  return (
    <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      )}

      {/* Header & Logo */}
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-800 text-amber-400 shadow-md">
          <Bike size={22} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-teal-900 tracking-tight leading-none">
            {mode === "signin" ? "Sign In to EasyRide" : "Create EasyRide Account"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === "signin"
              ? "Access your Rider or Staff dashboard"
              : "Choose your role & get immediate dashboard access"}
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            mode === "signin"
              ? "bg-white text-teal-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <LogIn size={14} />
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            mode === "signup"
              ? "bg-white text-teal-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <UserPlus size={14} />
          Create Account
        </button>
      </div>

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200 animate-pulse">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {/* SIGN IN FORM */}
      {mode === "signin" && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="rider@easyride.ug or staff@easyride.ug"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <span className="text-[11px] text-slate-400">Demo password: password123</span>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 btn-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <LogIn size={15} />
            {isSubmitting ? "Signing in..." : "Sign In & Open Dashboard"}
          </button>

          {/* Quick 1-Click Demo Logins */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              ⚡ 1-Click Demo Logins (No Backend Required)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin("rider")}
                className="p-3 rounded-2xl border-2 border-teal-600/30 bg-teal-50/50 hover:bg-teal-100/60 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950 mb-0.5">
                  <User size={13} className="text-teal-700" /> Alex (Rider)
                </div>
                <div className="text-[10px] text-teal-800 font-medium group-hover:text-teal-950">
                  Rides & holds →
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("staff")}
                className="p-3 rounded-2xl border-2 border-amber-600/30 bg-amber-50/50 hover:bg-amber-100/60 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 mb-0.5">
                  <Wrench size={13} className="text-amber-700" /> Sarah (Staff)
                </div>
                <div className="text-[10px] text-amber-800 font-medium group-hover:text-amber-950">
                  Station worker →
                </div>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SIGN UP FORM */}
      {mode === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Role Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedRole("rider")}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                  selectedRole === "rider"
                    ? "border-teal-700 bg-teal-50 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-950">
                    <User size={14} className="text-teal-700" /> Rider
                  </span>
                  {selectedRole === "rider" && (
                    <span className="w-4 h-4 rounded-full bg-teal-800 text-white grid place-items-center text-[10px]">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Rent bikes, request holds, calculate upfront fares
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("staff")}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                  selectedRole === "staff"
                    ? "border-amber-600 bg-amber-50 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <Wrench size={14} className="text-amber-700" /> Station Staff
                  </span>
                  {selectedRole === "staff" && (
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white grid place-items-center text-[10px]">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Check safety, dispatch rides, handle returns & quarantine
                </p>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="e.g. David Mukasa"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:bg-white"
              />
            </div>
          </div>

          {/* Email & Phone grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="david@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  placeholder="+256 700 123 456"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Assigned Station (if Staff) */}
          {selectedRole === "staff" && (
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1.5">
                Designated Station Assignment
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600" />
                <select
                  value={signUpStationId}
                  onChange={(e) => setSignUpStationId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/60 rounded-xl text-xs border border-amber-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {stations.length > 0 ? (
                    stations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.area})
                      </option>
                    ))
                  ) : (
                    <option value="station-makerere-main">Makerere Main Gate Station</option>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="Min 4 chars"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-3 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition ${
              selectedRole === "staff"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-teal-800 hover:bg-teal-900 text-white"
            }`}
          >
            <UserPlus size={15} />
            {isSubmitting
              ? "Creating..."
              : `Create ${selectedRole === "staff" ? "Staff" : "Rider"} Account & Redirect`}
            <ArrowRight size={14} />
          </button>
        </form>
      )}

      {/* Footer Info */}
      <div className="mt-5 text-center">
        <p className="text-[11px] text-slate-400">
          All accounts and states persist securely in your browser's LocalStorage. No server or backend needed.
        </p>
      </div>
    </div>
  );
}

export function AuthModal({
  open,
  initialMode = "signin",
  initialRole = "rider",
  stations = [],
  auth,
  onClose,
  onSuccess,
}: {
  open: boolean;
  initialMode?: "signin" | "signup";
  initialRole?: UserRole;
  stations?: EasyRideStation[];
  auth?: ReturnType<typeof useAuth>;
  onClose: () => void;
  onSuccess?: (user: EasyRideUser) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 enter">
      <AuthCard
        initialMode={initialMode}
        initialRole={initialRole}
        stations={stations}
        auth={auth}
        onClose={onClose}
        onSuccess={(user) => {
          onClose();
          onSuccess?.(user);
        }}
      />
    </div>
  );
}
