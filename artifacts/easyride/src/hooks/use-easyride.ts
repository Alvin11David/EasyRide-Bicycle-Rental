import { useState, useEffect, useCallback } from "react";
import type { EasyRideState } from "@workspace/api-client-react";
import { initialEasyRideState } from "@/lib/mock-data";

const STORAGE_KEY = "easyride_state_frontend_v3";

export function useEasyRide() {
  const [state, setState] = useState<EasyRideState>(() => {
    if (typeof window === "undefined") return initialEasyRideState;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as EasyRideState;
        // Basic sanity check to ensure state has bicycles
        if (parsed && Array.isArray(parsed.bicycles) && parsed.bicycles.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read stored easyride state:", e);
    }
    return initialEasyRideState;
  });

  const [saving, setSaving] = useState(false);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const save = useCallback((newState: EasyRideState) => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (e) {
      console.error("Failed to save easyride state to localStorage:", e);
    } finally {
      setTimeout(() => setSaving(false), 200);
    }
  }, []);

  const retry = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState(JSON.parse(stored));
      } else {
        setState(initialEasyRideState);
      }
    } catch {
      setState(initialEasyRideState);
    }
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setState(initialEasyRideState);
    } catch {}
  }, []);

  return {
    state,
    loading: false,
    error: null,
    retry,
    save,
    saving,
    reset,
  };
}
