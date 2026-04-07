"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { getSupabaseClient } from '@/lib/supabase';

export default function LoginPage() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#23272a] px-4">
        <div className="bg-[#313338] p-8 rounded-2xl shadow-lg border border-[#2c2f33] w-full max-w-md">
          <h1 className="text-2xl font-bold text-[#7289da] mb-4 text-center">Configuração pendente</h1>
          <p className="text-sm text-[#f2f3f5] text-center">
            Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel para habilitar o login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#23272a]">
      <div className="bg-[#313338] p-8 rounded-2xl shadow-lg border border-[#2c2f33] w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#7289da] mb-6 text-center">Acesso Restrito</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google"]}
          onlyThirdPartyProviders
          theme="dark"
        />
      </div>
    </div>
  );
}
