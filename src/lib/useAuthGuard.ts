"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ALLOWED_EMAILS = [
  "seuemail@gmail.com", // Substitua pelo(s) email(s) autorizado(s)
];

export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/login");
        return;
      }
      const email = data.user.email;
      if (!email || !ALLOWED_EMAILS.includes(email)) {
        await supabase.auth.signOut();
        router.replace("/login");
      }
    };
    checkAuth();
  }, [router]);
}
