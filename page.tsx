'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErr(error.message); return; }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    if (prof?.role === 'owner') router.push('/owner'); else router.push('/admin');
  }

  return (
    <div className="card" style={{maxWidth:420, margin:'48px auto'}}>
      <h2>Login</h2>
      <form onSubmit={onSubmit} className="row" style={{flexDirection:'column', gap:12}}>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/>
        {err && <div style={{color:'crimson', fontSize:12}}>{err}</div>}
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}