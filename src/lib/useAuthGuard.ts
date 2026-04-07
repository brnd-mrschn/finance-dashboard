"use client";


import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase";


// Adicione aqui os e-mails autorizados
const ALLOWED_EMAILS = [
  "monef4xgames@gmail.com", // Substitua pelo seu e-mail completo
  "vinicius@dznprojectmedia.com", // Substitua pelo seu e-mail completo
];

export function useAuthGuard() {
  const router = useRouter();
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        router.replace("/login");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email || !ALLOWED_EMAILS.includes(user.email)) {
        router.replace("/login");
      }
    };
    checkAuth();
  }, [router]);
}
