'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Role = 'owner' | 'admin';
type Settings = { commission_rate: number } | null;

type PerAdmin = {
  admin_id: string;
  admin_name: string;
  tx_count: number;
  gross_sales: number;
  total_capital: number;
  total_margin: number;
  total_commission: number;
};

export default function OwnerPage() {
  const supabase = createClientComponentClient();
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const [settings, setSettings] = useState<Settings>(null);
  const [rateInput, setRateInput] = useState<number>(0.25);
  const [savingRate, setSavingRate] = useState(false);
  const [recalcBusy, setRecalcBusy] = useState(false);

  const [rows, setRows] = useState<PerAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Auth + role
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id || null;
      setUid(id);
      if (!id) return;

      const { data: prof, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', id)
        .maybeSingle();

      if (error || !prof) {
        setErr(error?.message ?? 'Profile missing');
        return;
      }
      if (prof.role !== 'owner') {
        // safety: only owners should see this page
        window.location.href = '/admin';
        return;
      }
      setRole('owner');
    })();
  }, [supabase]);

  // Load settings + sales table
  async function loadAll() {
    setLoading(true);
    setErr(null);
    const [{ data: setData, error: sErr }, { data: salesData, error: vErr }] = await Promise.all([
      supabase.from('settings').select('commission_rate').eq('id', 1).maybeSingle(),
      supabase.from('sales_per_admin').select('*').order('gross_sales', { ascending: false }),
    ]);

    if (sErr) setErr(sErr.message);
    if (setData) {
      setSettings(setData as any);
      setRateInput(Number((setData as any).commission_rate ?? 0.25));
    }
    if (vErr) setErr(vErr.message);
    setRows((salesData as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (role === 'owner') loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const totals = useMemo(() => {
    const sales = rows.reduce((s, r) => s + Number(r.gross_sales || 0), 0);
    const cap   = rows.reduce((s, r) => s + Number(r.total_capital || 0), 0);
    const marg  = rows.reduce((s, r) => s + Number(r.total_margin || 0), 0);
    const comm  = rows.reduce((s, r) => s + Number(r.total_commission || 0), 0);
    const tx    = rows.reduce((s, r) => s + Number(r.tx_count || 0), 0);
    return { sales, cap, marg, comm, tx, ownerShare: Math.max(marg - comm, 0) };
  }, [rows]);

  async function saveRate() {
    setSavingRate(true);
    setErr(null);
    try {
      const clean = Math.max(0, Math.min(Number(rateInput), 0.5)); // limit to 0–50%
      const { error } = await supabase.from('settings').update({ commission_rate: clean }).eq('id', 1);
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to save rate');
    } finally {
      setSavingRate(false);
    }
  }

  async function recalc() {
    if (!confirm('Recalculate commissions on ALL past records using the current rate?')) return;
    setRecalcBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.rpc('recalc_commissions');
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setErr(e?.message ?? 'Recalc failed');
    } finally {
      setRecalcBusy(false);
    }
  }

  if (role !== 'owner') return <div style={{ padding: 24 }}>Checking access…</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: 12 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>👑 Owner Dashboard</h2>
        {err && <div style={{ color: 'crimson', fontSize: 12 }}>{err}</div>}
      </header>

      {/* Rate Controls */}
      <section style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Admin Commission Rate</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={rateInput}
            onChange={(e) => setRateInput(Number(e.target.value))}
            style={{ width: 240 }}
          />
          <input
            type="number"
            min={0}
            max={0.5}
            step={0.01}
            value={rateInput}
            onChange={(e) => setRateInput(Number(e.target.value))}
            style={{ width: 90 }}
          />
          <span>( 0.25 = 25% )</span>
          <button onClick={saveRate} disabled={savingRate} style={{ marginLeft: 'auto' }}>
            {savingRate ? 'Saving…' : 'Save Rate'}
          </button>
          <button onClick={recalc} disabled={recalcBusy}>
            {recalcBusy ? 'Recalculating…' : 'Recalculate commissions'}
          </button>
        </div>
      </section>

      {/* Totals */}
      <section style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Totals</h3>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}>
            <Card title="Transactions" value={String(totals.tx)} />
            <Card title="Gross Sales" value={`₱${totals.sales.toFixed(2)}`} />
            <Card title="Capital" value={`₱${totals.cap.toFixed(2)}`} />
            <Card title="Margin" value={`₱${totals.marg.toFixed(2)}`} />
            <Card title="Commissions (Admins)" value={`₱${totals.comm.toFixed(2)}`} />
            <Card title="Your Share (Owner)" value={`₱${totals.ownerShare.toFixed(2)}`} />
          </div>
        )}
      </section>

      {/* Per-Admin Table */}
      <section style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Per-Admin Performance</h3>
        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No data yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  <th className="p-2">Admin</th>
                  <th className="p-2">Transactions</th>
                  <th className="p-2">Gross Sales</th>
                  <th className="p-2">Capital</th>
                  <th className="p-2">Margin</th>
                  <th className="p-2">Commission</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.admin_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td className="p-2">{r.admin_name}</td>
                    <td className="p-2">{r.tx_count}</td>
                    <td className="p-2">₱{Number(r.gross_sales || 0).toFixed(2)}</td>
                    <td className="p-2">₱{Number(r.total_capital || 0).toFixed(2)}</td>
                    <td className="p-2">₱{Number(r.total_margin || 0).toFixed(2)}</td>
                    <td className="p-2">₱{Number(r.total_commission || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}