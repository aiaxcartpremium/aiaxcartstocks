'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '../../lib/supabaseClient'
export default function LoginPage() {
  const router = useRouter();

  // ui state
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // optional on signup
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // if already logged-in, route by role
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle();
      if (prof?.role === 'owner') router.replace('/owner');
      else if (prof?.role === 'admin') router.replace('/admin');
    })();
  }, [router]);

  // ensure a profiles row exists
  async function ensureProfile(userId: string, nameHint?: string) {
    const { data: row } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!row) {
      // default role is 'admin' (owner promotes via SQL once)
      await supabase.from('profiles').insert({
        id: userId,
        full_name: nameHint ?? null,
        email,
        role: 'admin',
      });
    }
  }

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const user = data.user;
      if (!user) throw new Error('No user returned');
      await ensureProfile(user.id);

      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (pErr) throw pErr;

      router.replace(prof.role === 'owner' ? '/owner' : '/admin');
    } catch (e: any) {
      setErr(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function doSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      const user = data.user;
      if (!user) throw new Error('Sign up ok, but no user returned');
      await ensureProfile(user.id, fullName || email);
      router.replace('/admin'); // default new users become admin (owner will promote later)
    } catch (e: any) {
      setErr(e?.message ?? 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: 16, border: '1px solid #e5e7eb', borderRadius: 10 }}>
      <h2 style={{ margin: '0 0 10px' }}>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>

      <form onSubmit={mode === 'login' ? doLogin : doSignup} style={{ display: 'grid', gap: 10 }}>
        {mode === 'signup' && (
          <input
            placeholder="Full name (optional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          autoCapitalize="none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {err && <div style={{ color: 'crimson', fontSize: 12 }}>{err}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <div style={{ marginTop: 10, fontSize: 14 }}>
        {mode === 'login' ? (
          <>
            No account yet?{' '}
            <button
              onClick={() => setMode('signup')}
              style={{ background: 'transparent', border: 'none', color: '#2563eb', padding: 0, cursor: 'pointer' }}
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setMode('login')}
              style={{ background: 'transparent', border: 'none', color: '#2563eb', padding: 0, cursor: 'pointer' }}
            >
              Sign in
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        Tip: First-time **Owner** should sign up, then in Supabase run:<br />
        <code>update public.profiles set role = 'owner' where id = auth.uid();</code>
      </div>
    </div>
  );
}