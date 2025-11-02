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
type Role = 'owner' | 'admin' | 'user' | null;

type Profile = { id: string; email?: string; role: Role };

type Stock = {
  id: string;
  product: string;
  category: string;
  status: 'available' | 'reserved' | 'sold';
  price: number | null;
  buyer_email: string | null;
  created_at: string;
};

type Sale = {
  id: number;
  stock_id: string | null;
  product: string;
  category: string;
  price: number;
  buyer_email: string | null;
  sold_by: string | null;
  sold_at: string;
};

export default function OwnerPage() {
  const router = useRouter();

  // session/role
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // tabs
  const [tab, setTab] = useState<'stocks' | 'sales' | 'users' | 'settings'>('stocks');

  // filters
  const [filterCat, setFilterCat] = useState<ProductCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  // form – add/edit
  const [formCat, setFormCat] = useState<ProductCategory>('entertainment');
  const [formProduct, setFormProduct] = useState(PRODUCT_OPTIONS['entertainment'][0]);
  const [formPrice, setFormPrice] = useState<string>('');
  const formProducts = useMemo(() => PRODUCT_OPTIONS[formCat], [formCat]);

  // data
  const [rows, setRows] = useState<Stock[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // my role
      const { data: prof } = await supabase
        .from('profiles').select('id, role, email').eq('id', user.id).single();

      const role = (prof?.role as Role) ?? null;
      setMe({ id: user.id, role, email: prof?.email });

      if (role !== 'owner') { 
        router.push('/admin'); // owners only
        return;
      }
      await Promise.all([fetchStocks(), fetchSales(), fetchUsers()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStocks(cat: ProductCategory | 'all' = filterCat) {
    let q = supabase.from('stocks').select('*').order('created_at', { ascending: false });
    if (cat !== 'all') q = q.eq('category', cat);
    const { data } = await q;
    setRows((data as Stock[]) ?? []);
  }

  async function fetchSales() {
    const { data } = await supabase.from('sales').select('*').order('sold_at', { ascending: false });
    setSales((data as Sale[]) ?? []);
  }

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('id, email, role').order('email');
    setUsers((data as Profile[]) ?? []);
  }

  // STOCK actions
  async function addStock(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('stocks').insert({
      product: formProduct,
      category: formCat,
      price: formPrice ? Number(formPrice) : null,
      status: 'available'
    });
    setFormPrice('');
    await fetchStocks('all');
    setFilterCat('all');
  }

  async function editPrice(id: string) {
    const val = prompt('New price:');
    if (!val) return;
    await supabase.from('stocks').update({ price: Number(val) }).eq('id', id);
    fetchStocks();
  }

  async function reserve(id: string) {
    await supabase.from('stocks').update({ status: 'reserved' }).eq('id', id);
    fetchStocks();
  }

  async function markAvailable(id: string) {
    await supabase.from('stocks')
      .update({ status: 'available', buyer_email: null, sold_at: null })
      .eq('id', id);
    fetchStocks();
  }

  async function markSold(id: string) {
    const buyer = prompt('Buyer email (optional):') || null;
    const priceStr = prompt('Final price (required):', '0') || '0';
    await supabase.rpc('mark_sold', { p_stock_id: id, p_buyer_email: buyer, p_price: Number(priceStr) });
    await Promise.all([fetchStocks(), fetchSales()]);
  }

  async function removeStock(id: string) {
    if (!confirm('Delete this stock?')) return;
    await supabase.from('stocks').delete().eq('id', id);
    fetchStocks();
  }

  // BULK add via CSV-like lines: "category,product,price"
  async function bulkAdd() {
    const text = prompt('Paste lines: category, product, price\nExample:\nentertainment, netflix — shared profile, 120');
    if (!text) return;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const payload = [];
    for (const line of lines) {
      const [cat, prod, price] = line.split(',').map(s => (s ?? '').trim());
      if (!cat || !prod) continue;
      payload.push({ category: cat, product: prod, price: price ? Number(price) : null, status: 'available' });
    }
    if (payload.length) {
      await supabase.from('stocks').insert(payload);
      fetchStocks('all');
      setFilterCat('all');
    }
  }

  // USER actions
  async function promote(id: string) {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', id);
    fetchUsers();
  }
  async function demote(id: string) {
    await supabase.from('profiles').update({ role: 'user' }).eq('id', id);
    fetchUsers();
  }
  async function makeOwner(id: string) {
    if (!confirm('Make this user OWNER? This is powerful.')) return;
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', id);
    fetchUsers();
  }

  async function exportCSV() {
    const header = 'sold_at,product,category,price,buyer_email,stock_id\n';
    const body = sales.map(s =>
      [s.sold_at, s.product, s.category, s.price, s.buyer_email ?? '', s.stock_id ?? ''].join(',')
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sales_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  // filter+search view
  const filtered = rows.filter(r => {
    const inCat = filterCat === 'all' ? true : r.category === filterCat;
    const q = search.trim().toLowerCase();
    const inText = !q || r.product.toLowerCase().includes(q);
    return inCat && inText;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:12 }}>
        <h1 style={{ margin:0, fontSize:34 }}>Owner Console</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setTab('stocks')} style={tabBtn(tab==='stocks')}>Stocks</button>
          <button onClick={() => setTab('sales')} style={tabBtn(tab==='sales')}>Sales</button>
          <button onClick={() => setTab('users')} style={tabBtn(tab==='users')}>Users</button>
          <button onClick={() => setTab('settings')} style={tabBtn(tab==='settings')}>Settings</button>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {tab === 'stocks' && (
        <>
          {/* Controls */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center', margin:'8px 0 12px' }}>
            <button onClick={() => { setFilterCat('all'); fetchStocks('all'); }} style={chip(filterCat==='all')}>All</button>
            {PRODUCT_CATEGORIES.map(c => (
              <button key={c} onClick={() => { setFilterCat(c); fetchStocks(c); }} style={chip(filterCat===c)}>{c}</button>
            ))}
            <input placeholder="Search product…" value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }} />
            <div style={{ flex:1 }} />
            <button onClick={bulkAdd}>Bulk Add</button>
          </div>

          {/* Add form */}
          <form onSubmit={addStock} style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr auto', gap:8, marginBottom:16 }}>
            <select value={formCat} onChange={(e)=>{ const v=e.target.value as ProductCategory; setFormCat(v); setFormProduct(PRODUCT_OPTIONS[v][0]); }}>
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={formProduct} onChange={(e)=>setFormProduct(e.target.value)}>
              {formProducts.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" placeholder="Price" value={formPrice} onChange={e=>setFormPrice(e.target.value)} />
            <button type="submit">Add</button>
          </form>

          {/* Table */}
          <table width="100%" cellPadding={8} style={{ borderCollapse:'collapse' }}>
            <thead><tr>
              <th align="left">ID</th>
              <th align="left">Product</th>
              <th align="left">Category</th>
              <th align="left">Status</th>
              <th align="left">Price</th>
              <th align="left">Buyer</th>
              <th align="left">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderTop:'1px solid #eee' }}>
                  <td style={{ fontFamily:'monospace' }}>{r.id.slice(0,6)}…</td>
                  <td>{r.product}</td>
                  <td>{r.category}</td>
                  <td>{r.status}</td>
                  <td>{r.price ?? '-'}</td>
                  <td>{r.buyer_email ?? '-'}</td>
                  <td style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <button onClick={()=>editPrice(r.id)}>Edit ₱</button>
                    {r.status!=='reserved' && r.status!=='sold' && <button onClick={()=>reserve(r.id)}>Reserve</button>}
                    {r.status!=='available' && <button onClick={()=>markAvailable(r.id)}>Make Available</button>}
                    {r.status!=='sold' && <button onClick={()=>markSold(r.id)}>Mark Sold</button>}
                    <button onClick={()=>removeStock(r.id)} style={{ color:'#b00' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={7} align="center" style={{ color:'#666', padding:24 }}>No rows</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {tab === 'sales' && (
        <section>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <h2 style={{ margin:0 }}>Sales History</h2>
            <button onClick={exportCSV}>Export CSV</button>
          </div>
          <table width="100%" cellPadding={8} style={{ borderCollapse:'collapse' }}>
            <thead><tr>
              <th align="left">Date</th>
              <th align="left">Product</th>
              <th align="left">Category</th>
              <th align="left">Price</th>
              <th align="left">Buyer</th>
            </tr></thead>
            <tbody>
              {sales.map(s=>(
                <tr key={s.id} style={{ borderTop:'1px solid #eee' }}>
                  <td>{new Date(s.sold_at).toLocaleString()}</td>
                  <td>{s.product}</td>
                  <td>{s.category}</td>
                  <td>{s.price}</td>
                  <td>{s.buyer_email ?? '-'}</td>
                </tr>
              ))}
              {sales.length===0 && <tr><td colSpan={5} align="center" style={{ color:'#666', padding:24 }}>No sales yet</td></tr>}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'users' && (
        <section>
          <h2>User Roles</h2>
          <table width="100%" cellPadding={8} style={{ borderCollapse:'collapse' }}>
            <thead><tr>
              <th align="left">Email</th>
              <th align="left">Role</th>
              <th align="left">Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} style={{ borderTop:'1px solid #eee' }}>
                  <td>{u.email ?? u.id}</td>
                  <td>{u.role ?? 'user'}</td>
                  <td style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <button onClick={()=>promote(u.id)}>Make Admin</button>
                    <button onClick={()=>demote(u.id)}>Make User</button>
                    <button onClick={()=>makeOwner(u.id)} style={{ color:'#b00' }}>Make Owner</button>
                  </td>
                </tr>
              ))}
              {users.length===0 && <tr><td colSpan={3} align="center" style={{ color:'#666', padding:24 }}>No users</td></tr>}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'settings' && (
        <section>
          <h2>Settings</h2>
          <p style={{ color:'#666' }}>More toggles can go here later (e.g., approval flow, price caps, etc.).</p>
        </section>
      )}
    </div>
  );
}

function chip(active:boolean): React.CSSProperties {
  return { padding:'6px 10px', border:'1px solid #ddd', borderRadius:999, background:active?'#111':'#fff', color:active?'#fff':'#111' };
}
function tabBtn(active:boolean): React.CSSProperties {
  return { padding:'8px 10px', border:'1px solid #ddd', borderRadius:8, background:active?'#111':'#fff', color:active?'#fff':'#111' };
}