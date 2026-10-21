import { useState, useEffect, useCallback } from "react";

export type UserRole = "rider" | "staff";

export interface EasyRideUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  stationId?: string; // Station assigned to staff member
  avatar?: string;
  createdAt: string;
}

const USERS_STORAGE_KEY = "easyride_users_v1";
const SESSION_STORAGE_KEY = "easyride_auth_session_v1";
const AUTH_EVENT = "easyride_auth_change";

export const DEFAULT_USERS: EasyRideUser[] = [
  {
    id: "user-atugonza",
    name: "Atugonza",
    email: "atugonza@easyride.ug",
    password: "password123",
    role: "rider",
    phone: "+256 772 100 200",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    createdAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "user-rider-demo",
    name: "Alex Kigozi",
    email: "rider@easyride.ug",
    password: "password123",
    role: "rider",
    phone: "+256 772 123 456",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    createdAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "user-staff-demo",
    name: "Sarah Nabirye",
    email: "staff@easyride.ug",
    password: "password123",
    role: "staff",
    phone: "+256 701 987 654",
    stationId: "station-makerere-main",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    createdAt: "2026-01-10T08:30:00.000Z",
  },
];

function broadcastAuthChange(user: EasyRideUser | null) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user }));
  }
}

export function getStoredUsers(): EasyRideUser[] {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingEmails = new Set(parsed.map((u: EasyRideUser) => u.email?.toLowerCase()));
        let merged = false;
        for (const def of DEFAULT_USERS) {
          if (!existingEmails.has(def.email.toLowerCase())) {
            parsed.push(def);
            merged = true;
          }
        }
        if (merged) {
          try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
          } catch {}
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read stored users:", e);
  }
  // Store default users on first run
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  } catch {}
  return DEFAULT_USERS;
}

export function getStoredSession(users: EasyRideUser[]): EasyRideUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const session = JSON.parse(raw) as { id: string; email: string };
      if (session && (session.id || session.email)) {
        const found = users.find(
          (u) => u.id === session.id || u.email.toLowerCase() === (session.email || "").toLowerCase()
        );
        if (found) return found;
      }
    }
  } catch (e) {
    console.warn("Could not read auth session:", e);
  }
  return null;
}

export function useAuth() {
  const [users, setUsers] = useState<EasyRideUser[]>(getStoredUsers);
  const [currentUser, setCurrentUser] = useState<EasyRideUser | null>(() => getStoredSession(users));

  // Sync across tabs and within the same window across hook instances
  useEffect(() => {
    const sync = () => {
      const currentUsers = getStoredUsers();
      setUsers(currentUsers);
      const activeSession = getStoredSession(currentUsers);
      setCurrentUser(activeSession);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === USERS_STORAGE_KEY || e.key === SESSION_STORAGE_KEY) {
        sync();
      }
    };

    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Sign up a new user
  const signup = useCallback(
    (data: {
      name: string;
      email: string;
      password?: string;
      role: UserRole;
      phone?: string;
      stationId?: string;
    }): { success: boolean; error?: string; user?: EasyRideUser } => {
      const emailClean = data.email.trim().toLowerCase();
      const nameClean = data.name.trim();

      if (!nameClean) {
        return { success: false, error: "Please enter your full name." };
      }
      if (!emailClean || !emailClean.includes("@")) {
        return { success: false, error: "Please provide a valid email address." };
      }
      if (data.password && data.password.length < 4) {
        return { success: false, error: "Password must be at least 4 characters." };
      }

      const currentUsers = getStoredUsers();
      const existing = currentUsers.find((u) => u.email.toLowerCase() === emailClean);
      if (existing) {
        return { success: false, error: "An account with this email already exists. Try signing in." };
      }

      const newUser: EasyRideUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: nameClean,
        email: emailClean,
        password: data.password || "password123",
        role: data.role,
        phone: data.phone?.trim() || "",
        stationId: data.role === "staff" ? data.stationId || "station-makerere-main" : undefined,
        createdAt: new Date().toISOString(),
        avatar:
          data.role === "staff"
            ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
            : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      };

      const nextUsers = [...currentUsers, newUser];
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ id: newUser.id, email: newUser.email, role: newUser.role })
        );
      } catch (err) {
        console.error("Failed to save user session locally:", err);
      }

      setUsers(nextUsers);
      setCurrentUser(newUser);
      broadcastAuthChange(newUser);

      return { success: true, user: newUser };
    },
    []
  );

  // Sign in an existing user
  const signin = useCallback(
    (
      email: string,
      password?: string
    ): { success: boolean; error?: string; user?: EasyRideUser } => {
      const emailClean = email.trim().toLowerCase();
      if (!emailClean) {
        return { success: false, error: "Please enter your email." };
      }

      const currentUsers = getStoredUsers();
      const found = currentUsers.find((u) => u.email.toLowerCase() === emailClean);
      if (!found) {
        return { success: false, error: "No account found with this email. Please check or sign up." };
      }

      if (password && found.password && found.password !== password) {
        return { success: false, error: "Incorrect password. Default demo password is password123" };
      }

      try {
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ id: found.id, email: found.email, role: found.role })
        );
      } catch (err) {
        console.error("Failed to save auth session locally:", err);
      }

      setCurrentUser(found);
      broadcastAuthChange(found);

      return { success: true, user: found };
    },
    []
  );

  // Quick switch to demo role
  const quickDemoLogin = useCallback(
    (role: UserRole) => {
      const currentUsers = getStoredUsers();
      const demo = currentUsers.find((u) => u.role === role) || DEFAULT_USERS.find((u) => u.role === role);
      if (demo) {
        try {
          localStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({ id: demo.id, email: demo.email, role: demo.role })
          );
        } catch {}

        setCurrentUser(demo);
        broadcastAuthChange(demo);
        return demo;
      }
      return null;
    },
    []
  );

  // Sign out
  const signout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}

    setCurrentUser(null);
    broadcastAuthChange(null);
  }, []);

  return {
    users,
    currentUser,
    isAuthenticated: !!currentUser,
    isRider: currentUser?.role === "rider",
    isStaff: currentUser?.role === "staff",
    signup,
    signin,
    signout,
    quickDemoLogin,
  };
}
