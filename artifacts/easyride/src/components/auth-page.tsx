import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bike,
  CheckCircle2,
  ChevronDown,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
  Wrench,
} from "lucide-react";
import type { EasyRideStation } from "@workspace/api-client-react";
import { useAuth, type EasyRideUser, type UserRole } from "@/hooks/use-auth";

interface AuthPanelProps {
  /** Which account page is being shown — sign in and sign up are separate pages. */
  mode: "signin" | "signup";
  initialRole?: UserRole;
  stations?: EasyRideStation[];
  auth?: ReturnType<typeof useAuth>;
  onSuccess?: (user: EasyRideUser) => void;
  onSwitchMode: (mode: "signin" | "signup") => void;
}

/**
 * The sign-in / create-account form. Each mode is its own page: there is no
 * modal wrapper and no tab switcher, only a link across to the other page.
 */
export function AuthPanel({
  mode,
  initialRole = "rider",
  stations = [],
  auth: propAuth,
  onSuccess,
  onSwitchMode,
}: AuthPanelProps) {
  const localAuth = useAuth();
  const { signin, signup } = propAuth || localAuth;
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
  const [signUpStaffId, setSignUpStaffId] = useState("");
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
      staffId: selectedRole === "staff" ? signUpStaffId : undefined,
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

  return (
    <div
      className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
      data-purpose="auth-shell"
    >
      {/* Compact artwork strip on small screens (the full panel is on the right on desktop) */}
      <div
        className="relative flex items-center justify-between gap-4 overflow-hidden bg-gradient-to-br from-teal-800 to-teal-900 px-6 py-4 text-white lg:hidden"
        data-purpose="auth-artwork-mobile"
      >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">
              EasyRide fleet
            </p>
            <p className="mt-1 text-sm font-extrabold leading-tight">
              Your next ride is already waiting.
            </p>
          </div>
        <img
          src="/hero-bike.png"
          alt=""
          aria-hidden="true"
          className="h-20 w-auto shrink-0 drop-shadow-lg"
        />
      </div>

      <div className="lg:grid lg:grid-cols-2">
        <div
          className="relative p-6 md:p-8"
          data-purpose="auth-panel"
          data-auth-mode={mode}
        >
      {/* Header & Logo */}
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-800 text-amber-400 shadow-md">
          <Bike size={22} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-teal-900 tracking-tight leading-none">
            {mode === "signin" ? "Sign In to EasyRide" : "Create EasyRide Account"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === "signin"
              ? "Access your Rider or Staff dashboard"
              : "Choose your role & get immediate dashboard access"}
          </p>
        </div>
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
        <form onSubmit={handleSignIn} className="space-y-4" data-purpose="signin-form">
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
                placeholder="rider@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
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
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

        </form>
      )}

      {/* SIGN UP FORM */}
      {mode === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-4" data-purpose="signup-form">
          {/* Role selection dropdown */}
          <div>
              <label
                htmlFor="signup-role"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Select Your Role
              </label>
              <div className="relative">
                {selectedRole === "staff" ? (
                  <Wrench
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600"
                  />
                ) : (
                  <User
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-700"
                  />
                )}
                <select
                  id="signup-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className={`w-full appearance-none pl-10 pr-9 py-3 rounded-xl text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-2 ${
                    selectedRole === "staff"
                      ? "border-amber-300 bg-amber-50/60 text-amber-950 focus:ring-amber-500/30"
                      : "border-teal-300 bg-teal-50/60 text-teal-950 focus:ring-teal-700/30"
                  }`}
                  data-purpose="role-select"
                >
                  <option value="rider">Rider</option>
                  <option value="staff">Station Staff</option>
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
              <p className="mt-1.5 text-[10px] leading-tight text-slate-500">
                {selectedRole === "rider"
                  ? "Rent bikes, request holds, calculate upfront fares"
                  : "Check safety, dispatch rides, handle returns & quarantine"}
              </p>
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

          {/* Staff ID (required for station staff only) */}
          {selectedRole === "staff" && (
            <div>
              <label
                htmlFor="staff-id"
                className="block text-xs font-bold text-amber-900 mb-1.5"
              >
                Staff ID <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <BadgeCheck
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600"
                />
                <input
                  id="staff-id"
                  type="text"
                  required
                  value={signUpStaffId}
                  onChange={(e) => setSignUpStaffId(e.target.value)}
                  placeholder="e.g. ER-STAFF-1042"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/60 rounded-xl text-xs font-mono uppercase border border-amber-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  data-purpose="staff-id-input"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Your station-issued staff ID — required to open the staff console.
              </p>
            </div>
          )}

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
              : "Create Account"}
            <ArrowRight size={14} />
          </button>
        </form>
      )}

      {/* Cross-link to the other account page */}
      <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        {mode === "signin" ? (
          <>
            New to EasyRide?{" "}
            <button
              type="button"
              onClick={() => onSwitchMode("signup")}
              className="font-bold text-teal-800 hover:text-teal-950 hover:underline cursor-pointer"
              data-purpose="go-to-signup"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onSwitchMode("signin")}
              className="font-bold text-teal-800 hover:text-teal-950 hover:underline cursor-pointer"
              data-purpose="go-to-signin"
            >
              Sign in
            </button>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 text-center">
        <p className="text-[11px] text-slate-400">
          All accounts and states persist securely in your browser's LocalStorage. No server or backend needed.
        </p>
      </div>
        </div>

        {/* Full-height bicycle artwork panel on the right */}
        <aside
            className="relative hidden overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-teal-950 lg:flex lg:flex-col"
            data-purpose="auth-artwork"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />

            <div className="relative px-8 pt-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-amber-300">
                <Bike size={13} /> EasyRide fleet
              </span>
              <h2 className="mt-5 font-display text-2xl font-extrabold leading-tight">
                Your next ride is
                <br />
                <span className="text-amber-300">already waiting.</span>
              </h2>
              <p className="mt-2 max-w-[250px] text-xs leading-5 text-white/70">
                Real bikes, real photos and live availability at stations across
                Makerere, Kampala.
              </p>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-3 py-2">
              <div className="pointer-events-none absolute h-64 w-64 rounded-full border border-white/10 bg-white/5" />
              <img
                src="/hero-bike.png"
                alt="EasyRide bicycle"
                className="relative w-full max-w-[480px] drop-shadow-[0_28px_45px_rgba(0,0,0,0.5)]"
                data-purpose="auth-bike-image"
              />
            </div>

            <div className="relative flex items-center gap-2 border-t border-white/10 px-8 py-5 text-[11px] font-semibold text-white/70">
              <ShieldCheck size={15} className="text-amber-300" />
              Safety-checked at every handoff
            </div>
        </aside>
      </div>
    </div>
  );
}
