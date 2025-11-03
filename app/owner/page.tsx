// app/owner/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_OPTIONS,
  type ProductCategory
} from '../../lib/catalog';
import LogoutButton from '../../components/LogoutButton';
import { fastRequireRole } from '../../lib/auth';

type Role = 'owner' | 'admin' | 'user' | null;

type Stock = {
  id: string;
  product: string;
  category: string;
  status: 'available'|'reserved'|'sold';
  price: number | null;
  buyer_email: string | null;
  created_at: string;
};

export default function OwnerPage() {
  const router = useRouter();

  const [meRole, setMeRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  // data
  const [rows, setRows] = useState<Stock[]>([]);
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [status, setStatus] = useState<'available'|'reserved'|'sold'|'all'>('all');

  // fast access check
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) {
        setErr('Timeout while checking access. Please login again.');
        router.replace('/login');
      }
    }, 3000);

    (async () => {
      const res = await fastRequireRole(['owner'], router.replace);
      if (!res.ok) return;
      if (cancelled) return;

      setMeRole(res.role);
      await fetchRows();
      setLoading(false);
      clearTimeout(t);
    })();

    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRows() {
    let q = supabase.from('stocks').select('*').order('created_at', { ascending: false });
    if (category !== 'all') q = q.eq('category', category);
    if (status !== 'all') q = q.eq('status', status);
    const { data } = await q;
    setRows((data || []) as Stock[]);
  }

  useEffect(() => { if (!loading) fetchRows(); /* eslint-disable-next-line */ }, [category, status]);

  // quick metrics
  const available = useMemo(() => rows.filter(r => r.status==='available').length, [rows]);
  const sold = useMemo(() => rows.filter(r => r.status==='sold').length, [rows]);
  const revenue = useMemo(() => rows.reduce((s,r)=> s + (r.status==='sold' && r.price ? r.price : 0), 0), [rows]);

  // export CSV (owner-side)
  function exportCsv() {
    const header = ['id','product','category','status','price','buyer_email','created_at'];
    const lines = rows.map(r => [
      r.id, r.product, r.category, r.status, r.price ?? '', r.buyer_email ?? '', r.created_at
    ].map(x => `"${String(x).replace(/"/g,'""')}"`).join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'owner-stocks.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (err) return <div className="p-6">{err}</div>;
  if (loading) return <div className="p-6">Checking access…</div>;

  return (
    <div className="max-w-6xl mx-auto py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">Owner Console</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="border rounded px-3 py-1.5 text-sm hover:bg-neutral-100">Export CSV</button>
          <LogoutButton />
        </div>
      </header>

      <div className="mb-4 text-sm">
        <span className="mr-4">Role: {meRole}</span>
        <span className="mr-4">Available: {available}</span>
        <span className="mr-4">Sold: {sold}</span>
        <span className="mr-4">Revenue: ₱{revenue.toLocaleString()}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select className="border rounded px-2 py-1 text-sm" value={category}
                onChange={(e)=>setCategory(e.target.value as any)}>
          <option value="all">All categories</option>
          {PRODUCT_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>

        <select className="border rounded px-2 py-1 text-sm" value={status}
                onChange={(e)=>setStatus(e.target.value as any)}>
          <option value="all">All status</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>

        <button onClick={fetchRows} className="ml-auto border rounded px-3 py-1.5 text-sm hover:bg-neutral-100">
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
              <th className="text-left p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.id.slice(0,8)}</td>
                <td className="p-2">{r.product}</td>
                <td className="p-2 capitalize">{r.category}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.price ?? '—'}</td>
                <td className="p-2">{r.buyer_email ?? '—'}</td>
                <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-4 text-center text-neutral-500" colSpan={7}>No rows</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}