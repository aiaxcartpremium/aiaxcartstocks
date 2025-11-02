'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient';
import { PRODUCT_OPTIONS, PRODUCT_CATEGORIES } from '../../lib/catalog';

type Role = 'owner' | 'admin';

type Account = {
  id: number;
  product: string;
  status: 'available' | 'sold';
  price?: number | null;
  buyer?: string | null;
  // add other columns your table has
};

export default function AdminPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [rows, setRows] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 1) Auth guard + get role (expects table "profiles" with columns: id (uuid), role)
  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess?.session?.user;
      if (!user) {
        router.replace('/login');
        return;
      }
      setUid(user.id);

      const { data: prof, error: roleErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (roleErr) {
        setErr(roleErr.message);
      } else {
        setRole(prof?.role as Role);
      }
    })();
  }, [router]);

  // 2) Load stocks (expects table "account_records")
  useEffect(() => {
    (async () => {
      if (!uid) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('account_records')
        .select('*')
        .order('id', { ascending: false });

      if (error) setErr(error.message);
      else setRows((data ?? []) as Account[]);
      setLoading(false);
    })();
  }, [uid]);

  const totalAvailable = useMemo(
    () => rows.filter(r => r.status === 'available').length,
    [rows]
  );

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-500">Error: {err}</div>;

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin • Stocks</h1>
        <div className="text-sm opacity-75">
          {role ? `Signed in as ${role}` : 'Signed in'}
        </div>
      </header>

      {/* quick summary */}
      <section className="text-sm grid grid-cols-2 gap-3">
        <div className="rounded border p-3">Total rows: {rows.length}</div>
        <div className="rounded border p-3">Available: {totalAvailable}</div>
      </section>

      {/* simple table */}
      <section className="overflow-x-auto">
        <table className="min-w-[640px] w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Product</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Buyer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="p-2 border">{r.id}</td>
                <td className="p-2 border">{r.product}</td>
                <td className="p-2 border">{r.status}</td>
                <td className="p-2 border">{r.price ?? ''}</td>
                <td className="p-2 border">{r.buyer ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}