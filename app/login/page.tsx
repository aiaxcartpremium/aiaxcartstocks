// /app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient'
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'admin' | 'owner' | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleLogin() {
    try {
      setLoading(true);
      setErr(null);

      if (!mode) { setErr('Piliin muna: Admin or Owner'); return; }

      const email = mode === 'admin'
        ? process.env.NEXT_PUBLIC_LOGIN_ADMIN_EMAIL ?? process.env.LOGIN_ADMIN_EMAIL
        : process.env.NEXT_PUBLIC_LOGIN_OWNER_EMAIL ?? process.env.LOGIN_OWNER_EMAIL;

      const password = mode === 'admin'
        ? process.env.NEXT_PUBLIC_LOGIN_ADMIN_PASSWORD ?? process.env.LOGIN_ADMIN_PASSWORD
        : process.env.NEXT_PUBLIC_LOGIN_OWNER_PASSWORD ?? process.env.LOGIN_OWNER_PASSWORD;

      if (!email || !password) {
        setErr('Missing login env vars. Add them in Vercel: LOGIN_ADMIN_EMAIL/PASSWORD and LOGIN_OWNER_EMAIL/PASSWORD.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setErr(error.message); return; }

      router.replace(mode === 'admin' ? '/admin' : '/owner');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('admin')}
          className={`border rounded px-3 py-2 ${mode === 'admin' ? 'bg-black text-white' : ''}`}
        >
          Admin
        </button>
        <button
          onClick={() => setMode('owner')}
          className={`border rounded px-3 py-2 ${mode === 'owner' ? 'bg-black text-white' : ''}`}
        >
          Owner
        </button>
      </div>

      <button
        onClick={handleLogin}
        disabled={!mode || loading}
        className="w-full border rounded px-3 py-2 disabled:opacity-50"
      >
        {loading ? 'Signing in…' : (mode ? `Sign in as ${mode}` : 'Choose a role')}
      </button>

      {err && <p className="mt-3 text-red-600 text-sm">{err}</p>}
    </main>
  );
}