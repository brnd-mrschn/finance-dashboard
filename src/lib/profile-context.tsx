"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Profile = {
  id: string;
  name: string;
  ownerId: string;
};

type ProfileContextValue = {
  profiles: Profile[];
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;
  loading: boolean;
  profileError: string | null;
  reload: () => void;
};

const ProfileContext = createContext<ProfileContextValue>({
  profiles: [],
  activeProfile: null,
  setActiveProfile: () => {},
  loading: true,
  profileError: null,
  reload: () => {},
});

const STORAGE_KEY = "finance_active_profile_id";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setProfileError(null);
    try {
      const res = await fetch("/api/profiles");
      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        const msg = `[ProfileProvider] /api/profiles retornou ${res.status}: ${errText}`;
        console.error(msg);
        setProfileError(msg);
        setLoading(false);
        return;
      }
      const data: Profile[] = await res.json();
      setProfiles(data);

      // Restaura o perfil ativo do localStorage
      const savedId = typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;

      const saved = savedId ? data.find((p) => p.id === savedId) : null;
      const active = saved ?? data[0] ?? null;
      setActiveProfileState(active);
    } catch (err) {
      const msg = `[ProfileProvider] Erro ao buscar perfis: ${String(err)}`;
      console.error(msg);
      setProfileError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setActiveProfile = useCallback((profile: Profile) => {
    setActiveProfileState(profile);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, profile.id);
    }
  }, []);

  return (
    <ProfileContext.Provider value={{ profiles, activeProfile, setActiveProfile, loading, profileError, reload: load }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
