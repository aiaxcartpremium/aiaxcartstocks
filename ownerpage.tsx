'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import type { Database } from '@/lib/types';
import { CATALOG } from '@/lib/catalog';

type Account = Database['public']['Tables']['accounts']['Row'];
type SalesRow = Database['public']['Views']['sales_per_admin']['Row'];
type RecordWithAdmin = Database['public']['Views']['account_records_with_admin']['Row'];

const serviceOptions = CATALOG.flatMap(c => c.products).map(p => ({ key: p.key, label: p.label }));

export default function OwnerPage() {
  const [rows, setRows] = useState<Account[]>([]);
  const [admins, setAdmins] = useState<SalesRow[]>([]);
  const [form, setForm] = useState({service: serviceOptions[0].key, email:'', password:'', profile:'', pin:'', capital:0, price:0});

  async function load() {
    const { data: stock } = await supabase.from('accounts').select('*').order('id', {ascending:false});
    setRows(stock || []);
    const { data: sales } = await supabase.from('sales_per_admin').select('*').order('items_sold', {ascending:false});
    setAdmins(sales || []);
  }
  useEffect(() => { load(); }, []);

  async function addStock(e:any){
    e.preventDefault();
    const payload = {
      service: form.service,
      email: form.email.trim(),
      password: form.password.trim(),
      profile: form.profile || null,
      pin: form.pin || null,
      capital: Number(form.capital),
      price: Number(form.price),
    };
    const { error } = await supabase.from('accounts').insert(payload);
    if (error) alert(error.message);
    setForm({service: serviceOptions[0].key, email:'', password:'', profile:'', pin:'', capital:0, price:0});
    load();
  }

  async function deleteItem(id:number){
    if(!confirm('Delete this stock item?')) return;
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) alert(error.message);
    load();
  }

  return (
    <div className="row" style={{gap:24, alignItems:'flex-start'}}>
      <div style={{flex:1}}>
        <h2>Inventory (Owner)</h2>
        <form onSubmit={addStock} className="card" style={{marginBottom:16}}>
          <b>Add Stock</b>
          <div className="row" style={{flexWrap:'wrap'}}>
            <select value={form.service} onChange={e=>setForm(v=>({...v, service:e.target.value}))}>
              {serviceOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <input placeholder="Email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} required/>
            <input placeholder="Password" value={form.password} onChange={e=>setForm(v=>({...v,password:e.target.value}))} required/>
            <input placeholder="Profile (optional)" value={form.profile} onChange={e=>setForm(v=>({...v,profile:e.target.value}))}/>
            <input placeholder="PIN (optional)" value={form.pin} onChange={e=>setForm(v=>({...v,pin:e.target.value}))}/>
            <input type="number" step="0.01" placeholder="Capital (₱)" value={form.capital} onChange={e=>setForm(v=>({...v,capital:e.target.value as any}))} required/>
            <input type="number" step="0.01" placeholder="Price (₱)" value={form.price} onChange={e=>setForm(v=>({...v,price:e.target.value as any}))} required/>
            <button type="submit">Add</button>
          </div>
        </form>

        <table>
          <thead>
            <tr>
              <th>ID</th><th>Service</th><th>Account</th><th>Capital</th><th>Price</th><th>Status</th><th>Sold by</th><th>Added</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{serviceOptions.find(s=>s.key===r.service)?.label || r.service}</td>
                <td>
                  <div><b>{r.email}</b> / {r.password}</div>
                  <div style={{fontSize:12, color:'#666'}}>Profile: {r.profile || '—'}  |  PIN: {r.pin || '—'}</div>
                </td>
                <td>₱{Number(r.capital).toFixed(2)}</td>
                <td>₱{Number(r.price).toFixed(2)}</td>
                <td><span className="badge">{r.status}</span></td>
                <td style={{fontSize:12}}>{r.sold_by || '—'}</td>
                <td style={{fontSize:12}}>{new Date(r.date_added).toLocaleString()}</td>
                <td>{r.status==='available' && <button onClick={()=>deleteItem(r.id)}>Delete</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{width:340}}>
        <h3>Sales per Admin</h3>
        <div className="card">
          {admins.length===0 && <div>No sales yet.</div>}
          {admins.map(a=>(
            <div key={a.admin_id} style={{display:'grid', gridTemplateColumns:'1fr auto', gap:6, padding:'8px 0', borderBottom:'1px solid #eee'}}>
              <div>
                <div><b>{a.admin_name}</b></div>
                <div style={{fontSize:12, color:'#666'}}>Sold: {a.items_sold}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:12}}>Commission</div>
                <div><b>₱{a.total_commission.toFixed(2)}</b></div>
              </div>
            </div>
          ))}
        </div>

        <OwnerTotals />
        <OwnerRecords />
      </div>
    </div>
  );
}

function OwnerTotals(){
  const [sum, setSum] = useState<{gross:number; commission:number}>({gross:0, commission:0});
  useEffect(()=>{
    supabase.from('account_sales').select('gross_profit,commission')
      .then(({data})=>{
        const gross = (data||[]).reduce((s, r)=> s + Number(r.gross_profit||0), 0);
        const com = (data||[]).reduce((s, r)=> s + Number(r.commission||0), 0);
        setSum({gross, commission: com});
      });
  }, []);
  return (
    <div className="card" style={{marginTop:16}}>
      <b>Totals (All time)</b>
      <div className="row" style={{justifyContent:'space-between'}}><div>Gross Profit</div><div><b>₱{sum.gross.toFixed(2)}</b></div></div>
      <div className="row" style={{justifyContent:'space-between'}}><div>Commission (25%)</div><div><b>₱{sum.commission.toFixed(2)}</b></div></div>
      <div style={{fontSize:12, color:'#666', marginTop:8}}>Commission = (Price − Capital) × 0.25</div>
    </div>
  );
}

function OwnerRecords(){
  const [rows, setRows] = useState<RecordWithAdmin[]>([]);
  useEffect(()=>{
    (async ()=>{
      const { data } = await supabase.from('account_records_with_admin').select('*').order('id', {ascending:false});
      setRows(data || []);
    })();
  }, []);
  return (
    <div className="card" style={{marginTop:16}}>
      <b>All Account Records</b>
      <table style={{marginTop:8}}>
        <thead>
          <tr>
            <th>ID</th><th>Product</th><th>Buyer</th><th>Admin</th>
            <th>Availed</th><th>Duration</th><th>+Days</th><th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.product}</td>
              <td>{r.buyer_username}</td>
              <td>{r.admin_name}</td>
              <td style={{fontSize:12}}>{new Date(r.availed_at).toLocaleString()}</td>
              <td>{r.duration_days}d</td>
              <td>{r.extra_days}d</td>
              <td style={{fontWeight:600}}>{new Date(r.expires_at).toLocaleString()}</td>
            </tr>
          ))}
          {rows.length===0 && <tr><td colSpan={8} style={{padding:12, color:'#777'}}>No records.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}