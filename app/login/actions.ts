'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '../../lib/supabaseServer';

async function loginWith(role: 'admin' | 'owner') {
  const email =
    role === 'admin' ? process.env.LOGIN_ADMIN_EMAIL : process.env.LOGIN_OWNER_EMAIL;
  const password =
    role === 'admin' ? process.env.LOGIN_ADMIN_PASSWORD : process.env.LOGIN_OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error(`Missing env vars for ${role} credentials.`);
  }

  const supabase = createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  redirect(role === 'admin' ? '/admin' : '/owner');
}

export async function loginAsAdmin() {
  'use server';
  await loginWith('admin');
}

export async function loginAsOwner() {
  'use server';
  await loginWith('owner');
}