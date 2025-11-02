'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '6px 10px',
        border: '1px solid #ccc',
        borderRadius: 6,
        backgroundColor: '#fff',
        cursor: 'pointer',
      }}
    >
      Logout
    </button>
  );
}