'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import type { Database } from '@/lib/types';
import { CATALOG, expandTenureChoices } from '@/lib/catalog';

type Account = Database['public']['Tables']['accounts']['Row'];
type RecordRow = Database['public']['Tables']['account_records']['Row'];

const productLabel = (key:string) => {
  for (const c of CATALOG) for (const p of c.products) if (p.key===key) return p.label;
  return key;
};

export default function AdminPage(){
  const [me, setMe] = useState<{id:string; name?:string}|null>(null);
  const [rows, setRows] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  // Sell modal
  const [sellModal, setSellModal] = useState<{open:boolean; account:Account|null}>({open:false, account:null});

  async function load(){
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user ? { id: user.id, name: user.email ?? '' } : null);
    const { data } = await supabase.from('accounts').select('*').in('status', ['available']).order('id', {ascending:false});
    setRows(data || []);
  }
  useEffect(()=>{ load(); }, []);

  function openSell(a:Account){ setSellModal({open:true, account:a}); }
  function closeSell(){ setSellModal({open:false, account:null}); }

  return (
    <div>
      <h2>Available Stock (Admin)</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Service</th><th>Account</th><th>Capital</th><th>Price</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{productLabel(r.service)}</td>
              <td>
                <div><b>{r.email}</b> / {r.password}</div>
                <div style={{fontSize:12, color:'#666'}}>Profile: {r.profile || '—'} | PIN: {r.pin || '—'}</div>
              </td>
              <td>₱{Number(r.capital).toFixed(2)}</td>
              <td><b>₱{Number(r.price).toFixed(2)}</b></td>
              <td><button disabled={loading} onClick={()=>openSell(r)}>Sell</button></td>
            </tr>
          ))}
          {rows.length===0 && <tr><td colSpan={6} style={{padding:16, color:'#666'}}>No available stock.</td></tr>}
        </tbody>
      </table>

      <MySales />
      <RecordsPanel />

      {sellModal.open && sellModal.account && (
        <SellModal me={me!} account={sellModal.account} onClose={async ()=>{
          closeSell(); await load();
        }} />
      )}
    </div>
  );
}

function MySales(){
  const [rows, setRows] = useState<any[]>([]);
  useEffect(()=>{
    (async ()=>{
      const { data: { user } } = await supabase.auth.getUser();
      if(!user) return;
      const { data } = await supabase.from('account_sales').select('*').eq('sold_by', user.id).order('sold_at', {ascending:false});
      setRows(data || []);
    })();
  }, []);
  const total = rows.reduce((s,r)=> s + Number(r.commission), 0);
  return (
    <div className="card" style={{marginTop:24}}>
      <b>My Sales</b>
      <div style={{fontSize:12, color:'#666', marginTop:4}}>Commission per item = (Price − Capital) × 0.25</div>
      <table>
        <thead><tr><th>ID</th><th>Service</th><th>Price</th><th>Capital</th><th>Commission</th><th>Sold at</th></tr></thead>
        <tbody>
          {rows.map((r:any)=>(
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{productLabel(r.service)}</td>
              <td>₱{Number(r.price).toFixed(2)}</td>
              <td>₱{Number(r.capital).toFixed(2)}</td>
              <td><b>₱{Number(r.commission).toFixed(2)}</b></td>
              <td style={{fontSize:12}}>{r.sold_at ? new Date(r.sold_at).toLocaleString(): '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{justifyContent:'space-between', marginTop:8}}>
        <div>Total Commission</div><div><b>₱{total.toFixed(2)}</b></div>
      </div>
    </div>
  );
}

function RecordsPanel(){
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [form, setForm] = useState({ buyer_username:'', extra_days:0, availed_at: new Date().toISOString().slice(0,16) });
  // Keep simple manual add (admin-only sees own)
  useEffect(()=>{ (async ()=>{
    const { data } = await supabase.from('account_records').select('*').order('id', {ascending:false});
    setRows(data || []);
  })(); }, []);

  async function extend(id:number, addDays:number){
    const target = rows.find(r=>r.id===id); if(!target) return;
    const { error } = await supabase.from('account_records').update({ extra_days: addDays }).eq('id', id);
    if (error) return alert(error.message);
    const { data } = await supabase.from('account_records').select('*').order('id',{ascending:false});
    setRows(data || []);
  }

  return (
    <div className="card" style={{marginTop:24}}>
      <b>Account Records (Mine)</b>
      <table style={{marginTop:12}}>
        <thead>
          <tr><th>ID</th><th>Product</th><th>Buyer</th><th>Availed</th><th>Duration</th><th>+Days</th><th>Expires</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.product}</td>
              <td>{r.buyer_username}</td>
              <td style={{fontSize:12}}>{new Date(r.availed_at).toLocaleString()}</td>
              <td>{r.duration_days}d</td>
              <td>{r.extra_days}d</td>
              <td style={{fontWeight:600}}>{new Date(r.expires_at).toLocaleString()}</td>
              <td>
                <button onClick={()=>extend(r.id, r.extra_days + 1)}>+1d</button>
                <button onClick={()=>extend(r.id, r.extra_days + 7)} style={{marginLeft:6}}>+7d</button>
              </td>
            </tr>
          ))}
          {rows.length===0 && <tr><td colSpan={8} style={{padding:12, color:'#777'}}>No records yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function SellModal({ me, account, onClose }:{
  me:{id:string}, account:Account, onClose:()=>void
}){
  const [buyer, setBuyer] = useState('');
  const [catKey, setCatKey] = useState(CATALOG[0].key);
  const [prodKey, setProdKey] = useState(account.service); // prefill from account service
  const [variant, setVariant] = useState('');
  const [days, setDays] = useState(30);
  const [availed, setAvailed] = useState(new Date().toISOString().slice(0,16));
  const cat = useMemo(()=> CATALOG.find(c=>c.key===catKey)!, [catKey]);
  const prod = useMemo(()=> (cat.products.find(p=>p.key===prodKey) || cat.products[0]), [cat, prodKey]);
  const choices = useMemo(()=> {
    const vars = prod?.variants || [];
    const v = vars.find(v=>v.name===variant) || vars[0];
    const ex = (v?.tenures || []).flatMap(expandTenureChoices);
    return {vars, ex};
  }, [prod, variant]);

  useEffect(()=>{
    if (prod?.variants?.length) setVariant(prod.variants[0].name);
  }, [prodKey]);

  useEffect(()=>{
    if (choices.ex.length) setDays(choices.ex[0].days);
  }, [variant]);

  async function submit(){
    if (!buyer.trim()) return alert('Buyer username required');
    const { error } = await supabase.rpc('sell_account_and_record', {
      _account_id: account.id,
      _buyer_username: buyer.trim(),
      _duration_days: days,
      _extra_days: 0,
      _availed_at: new Date(availed).toISOString()
    });
    if (error) { alert(error.message); return; }
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <header>
          <b>Sell #{account.id} — {productLabel(account.service)}</b>
          <button onClick={onClose}>×</button>
        </header>
        <div className="row" style={{flexWrap:'wrap', marginBottom:8}}>
          <input placeholder="Buyer username" value={buyer} onChange={e=>setBuyer(e.target.value)} />
          <input type="datetime-local" value={availed} onChange={e=>setAvailed(e.target.value)}/>
        </div>
        <div className="row" style={{flexWrap:'wrap', marginBottom:12}}>
          <select value={catKey} onChange={e=>{ setCatKey(e.target.value); const first=CATALOG.find(c=>c.key===e.target.value)!.products[0]; setProdKey(first.key); }}>
            {CATALOG.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select value={prodKey} onChange={e=>setProdKey(e.target.value)}>
            {cat.products.map(p=> <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select value={variant} onChange={e=>setVariant(e.target.value)}>
            {choices.vars.map(v=> <option key={v.name} value={v.name}>{v.name}</option>)}
          </select>
          <select value={days} onChange={e=>setDays(parseInt(e.target.value,10))}>
            {choices.ex.map(tc => <option key={tc.label} value={tc.days}>{tc.label}</option>)}
          </select>
        </div>
        <div className="row" style={{justifyContent:'flex-end'}}>
          <button onClick={submit}>Confirm Sell & Create Record</button>
        </div>
      </div>
    </div>
  );
}
