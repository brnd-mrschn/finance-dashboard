"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase";
import { isEmailAllowed } from "./auth-config";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export function useAuthGuard() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    // Modo desenvolvimento: auth desativada
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === "true") {
      setAuthState("authenticated");
      return;
    }

    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setAuthState("unauthenticated");
        router.replace("/login");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.email || !isEmailAllowed(user.email)) {
        setAuthState("unauthenticated");
        router.replace("/login");
        return;
      }

      setAuthState("authenticated");
    };

    checkAuth();

    // Escuta mudanças de auth (login/logout)
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_OUT" || !session?.user) {
            setAuthState("unauthenticated");
            router.replace("/login");
          } else if (
            session.user.email &&
            isEmailAllowed(session.user.email)
          ) {
            setAuthState("authenticated");
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [router]);

  return authState;
}
