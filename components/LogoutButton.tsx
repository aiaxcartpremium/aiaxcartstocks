'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // or relative if you chose option B

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.push('/login');
    }
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