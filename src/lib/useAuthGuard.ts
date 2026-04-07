"use client";


import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";


// Adicione aqui os e-mails autorizados
const ALLOWED_EMAILS = [
  "monef4xgames@gmail.com", // Substitua pelo seu e-mail completo
  "vinicius@dznprojectmedia.com", // Substitua pelo seu e-mail completo
];

export function useAuthGuard() {
  const router = useRouter();
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email || !ALLOWED_EMAILS.includes(user.email)) {
        router.replace("/login");
      }
    };
    checkAuth();
  }, [router]);
}
