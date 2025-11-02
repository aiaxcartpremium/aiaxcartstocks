'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// ✅ use the singleton and relative paths
import { supabase } from '../../lib/supabaseClient';
import type { Stock, Category } from '../../lib/types';
import { PRODUCT_CATEGORIES } from '../../lib/catalog';
import LogoutButton from '../../components/LogoutButton';

export default function AdminPage() {
  const router = useRouter();

  const [role, setRole] = useState<'owner' | 'admin' | null>(null);
  const [rows, setRows] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [status, setStatus] = useState<'available' | 'reserved' | 'sold' | 'all'>('all');

  // load role + initial data
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!prof || !['owner', 'admin'].includes(prof.role)) {
        router.replace('/login');
        return;
      }
      setRole(prof.role);
      await fetchRows();
    })().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRows() {
    let q = supabase
      .from('stocks')
      .select('*')
      .order('created_at', { ascending: false });

    if (category !== 'all') q = q.eq('category', category);
    if (status !== 'all') q = q.eq('status', status);

    const { data, error } = await q;
    if (error) {
      console.error(error);
      return;
    }
    setRows((data || []) as Stock[]);
  }

  useEffect(() => {
    if (!loading) fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status]);

  async function onMarkSold(s: Stock) {
    const buyer = window.prompt('Buyer email (optional):', s.buyer_email ?? '') || null;
    const priceStr = window.prompt('Final price:', s.price ? String(s.price) : '');
    if (!priceStr) return;

    const price = Number(priceStr);
    if (Number.isNaN(price)) { alert('Invalid price'); return; }

    // ⚠️ param names must match your SQL function definition
    const { error } = await supabase.rpc('mark_sold', {
      p_stock_id: s.id,
      p_buyer_email: buyer,
      p_price: price,
    });

    if (error) {
      alert(error.message);
    } else {
      await fetchRows();
    }
  }

  const total = rows.length;
  const available = useMemo(
    () => rows.filter(r => r.status === 'available').length,
    [rows]
  );

  return (
    <div className="max-w-6xl mx-auto py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">
          {role ? (role === 'owner' ? 'Owner' : 'Admin') : 'Admin'} • Stocks
        </h1>
        <LogoutButton />
      </header>

      <p className="mb-2 text-sm">Signed in as {role ?? '...'}</p>
      <p className="mb-6 text-sm">Total rows: {total} • Available: {available}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className="border rounded px-2 py-1 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
        >
          <option value="all">All categories</option>
          {PRODUCT_CATEGORIES.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        <select
          className="border rounded px-2 py-1 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="all">All status</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>

        <button
          onClick={fetchRows}
          className="ml-auto border rounded px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Product</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Price</th>
              <th className="text-left p-2">Buyer</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.id.slice(0, 8)}</td>
                <td className="p-2">{r.product}</td>
                <td className="p-2 capitalize">{r.category}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.price ?? '—'}</td>
                <td className="p-2">{r.buyer_email ?? '—'}</td>
                <td className="p-2">
                  {r.status !== 'sold' && (
                    <button
                      onClick={() => onMarkSold(r)}
                      className="border rounded px-2 py-1 hover:bg-neutral-100"
                    >
                      Mark as sold
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-center text-neutral-500" colSpan={7}>
                  No rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}