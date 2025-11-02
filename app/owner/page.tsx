'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import LogoutButton from '@/components/LogoutButton';

type Sale = {
  id: number;
  product: string;
  category: string;
  price: number;
  buyer_email: string | null;
  sold_by: string;
  sold_at: string;
};

export default function OwnerPage() {
  const router = useRouter();
  const supabase = createClient();
  const [rows, setRows] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/login');

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!prof || prof.role !== 'owner') return router.replace('/admin'); // owner-only
      const { data } = await supabase
        .from('sales')
        .select('*')
        .order('sold_at', { ascending: false });
      setRows((data || []) as Sale[]);
    })().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRevenue = useMemo(
    () => rows.reduce((a, b) => a + Number(b.price || 0), 0),
    [rows]
  );

  return (
    <div className="max-w-6xl mx-auto py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">Owner • Sales</h1>
        <LogoutButton />
      </header>

      <p className="mb-4 text-sm">
        Total sales: {rows.length} • Revenue: <b>{totalRevenue}</b>
      </p>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Product</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Price</th>
              <th className="text-left p-2">Buyer</th>
              <th className="text-left p-2">Sold at</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.id}</td>
                <td className="p-2">{r.product}</td>
                <td className="p-2 capitalize">{r.category}</td>
                <td className="p-2">{r.price}</td>
                <td className="p-2">{r.buyer_email ?? '—'}</td>
                <td className="p-2">{new Date(r.sold_at).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-center text-neutral-500" colSpan={6}>
                  No sales yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}