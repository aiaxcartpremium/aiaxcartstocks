'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // for signup only
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // If already logged in, push to correct page
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
      if (prof?.role === 'owner') router.replace('/owner');
      else if (prof?.role === 'admin') router.replace('/admin');
    })();
  }, [router]);

  async function ensureProfile(userId: string, nameHint?: string) {
    // make sure the row exists in public.profiles
    const { data: exists } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (!exists) {
      // default role = 'admin' (owner will promote via SQL once)
      await supabase.from('profiles').insert({
        id: userId,
        full_name: nameHint ?? null,
        role: 'admin',
      });
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error('No user returned');

      await ensureProfile(user.id);

      const { data: prof, error: pErr } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (pErr) throw pErr;

      if (prof.role === 'owner') router.replace('/owner');
      else router.replace('/admin');
    } catch (e: any) {
      setErr(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error('Sign up ok, but no user returned');

      await ensureProfile(user.id, fullName || email);

      // After sign up, send them to admin by default (owner can promote later)
      router.replace('/admin');
    } catch (e: any) {
      setErr(e?.message ?? 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth: 420, margin: '48px auto'}} className="card">
      <h2 style={{marginBottom: 12}}>{mode === 'login' ? 'Login' : 'Create account'}</h2>

      <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={{display: 'grid', gap: 10}}>
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoCapitalize="none"
        />
        <input
          type="password"
          placeholder="Password (min 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {err && <div style={{color: 'crimson', fontSize: 12}}>{err}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : (mode === 'login' ? 'Sign in' : 'Sign up')}
        </button>
      </form>

      <div style={{marginTop: 10, fontSize: 14}}>
        {mode === 'login' ? (
          <>
            No account yet?{' '}
            <button
              onClick={() => setMode('signup')}
              style={{background: 'transparent', border: 'none', color: '#2563eb', padding: 0, cursor: 'pointer'}}
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setMode('login')}
              style={{background: 'transparent', border: 'none', color: '#2563eb', padding: 0, cursor: 'pointer'}}
            >
              Sign in
            </button>
          </>
        )}
      </div>

      <div style={{marginTop: 12, fontSize: 12, color: '#666'}}>
        Tip: First time owner should sign up here, then in Supabase SQL run:<br/>
        <code>update profiles set role = 'owner' where id = auth.uid();</code>
      </div>
    </div>
  );
}
