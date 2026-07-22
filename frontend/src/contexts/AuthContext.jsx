import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [platformRole, setPlatformRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null);
      setPlatformRole(null);
      return null;
    }

    const [{ data, error }, { data: platformAccess, error: platformError }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, phone, role, notifications_offers, notifications_loyalty, notifications_news, created_at, updated_at")
        .eq("id", user.id)
        .single(),
      supabase
        .from("platform_admins")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (error) {
      console.error("Could not load profile:", error);
      setProfile(null);
    } else {
      setProfile(data);
    }

    if (platformError) {
      console.error("Could not load platform access:", platformError);
      setPlatformRole(null);
    } else {
      setPlatformRole(platformAccess?.role || null);
    }

    return data || null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return null;
    return loadProfile(session.user);
  }, [loadProfile, session]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const nextSession = data.session ?? null;
      setSession(nextSession);
      await loadProfile(nextSession?.user ?? null);
      if (mounted) setLoading(false);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await loadProfile(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    platformRole,
    isAdmin: profile?.role === "admin",
    isPlatformAdmin: platformRole === "platform_admin",
    loading,
    refreshProfile,
    signOut: () => supabase.auth.signOut(),
  }), [session, profile, platformRole, loading, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth må brukes inni AuthProvider");
  return context;
}
