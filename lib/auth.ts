// lib/auth.ts
'use client';

import { supabase } from './supabaseClient';

export type Role = 'owner' | 'admin' | 'user' | null;

export async function fastRequireRole(roles: Role[], onRedirect: (path: string)=>void) {
  // 1) Super fast: check session first (no network if cached)
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  // No session? agad na agad → login
  if (!session) {
    onRedirect('/login');
    return { ok:false as const, reason:'NO_SESSION' as const };
  }

  // 2) Single network call to get role
  const uid = session.user.id;
  const { data: prof, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single();

  if (error || !prof) {
    onRedirect('/login');
    return { ok:false as const, reason:'NO_PROFILE' as const };
  }

  const allowed = roles.includes((prof.role as Role) ?? null);
  if (!allowed) {
    onRedirect('/login');
    return { ok:false as const, reason:'FORBIDDEN' as const };
  }

  return { ok:true as const, role: prof.role as Role };
}