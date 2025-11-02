"use client";

import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '../../lib/supabaseClient'
import { PRODUCT_OPTIONS } from "@/lib/catalog";

type Role = "owner" | "admin";
type Account = {
  id: number;
  product: string;
  plan_type: string | null;
  duration_months: number;
  price: number | null;    // list price
  capital: number | null;  // owner capital
  status: "available" | "sold";
  created_at: string;
};

type RecordRow = {
  id: number;
  admin_id: string;
  sell_price: number | null;
  capital: number | null;
  commission: number | null;
};

export default function AdminPage() {
  const supabase = createClientComponentClient();

  // session + role
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  // data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "available" | "sold">("all");

  // add/edit
  const [editing, setEditing] = useState<Account | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    product: "",
    plan_type: "",
    duration_months: 1,
    price: "" as any,
    capital: "" as any,
    status: "available" as "available" | "sold",
  });
  const [busy, setBusy] = useState(false);

  // sell modal
  const [sellAcc, setSellAcc] = useState<Account | null>(null);
  const [showSell, setShowSell] = useState(false);
  const [sell, setSell] = useState({
    buyer_username: "",
    duration_days: 30,
    extra_days: 0,
    sell_price: "" as any,
    capital: "" as any,
  });

  // ---------- session + role ----------
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id || null;
      setUid(id);
      if (!id) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", id)
        .maybeSingle();

      setRole((prof?.role as Role) ?? null);
    })();
  }, [supabase]);

  // ---------- fetch ----------
  async function fetchAll() {
    setLoading(true);
    const [{ data: acc }, { data: rec }] = await Promise.all([
      supabase.from("accounts").select("*").order("created_at", { ascending: false }),
      role === "owner"
        ? supabase.from("account_records").select("id, admin_id, sell_price, capital, commission")
        : supabase.from("account_records").select("id, admin_id, sell_price, capital, commission").eq("admin_id", uid || ""),
    ]);
    setAccounts((acc || []) as Account[]);
    setRecords((rec || []) as RecordRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!role) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return accounts.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (!s) return true;
      return (
        a.product.toLowerCase().includes(s) ||
        (a.plan_type ?? "").toLowerCase().includes(s)
      );
    });
  }, [accounts, q, status]);

  // ---------- owner summary ----------
  const ownerSummary = useMemo(() => {
    if (role !== "owner") return null;
    const totalSales = records.reduce((t, r) => t + (Number(r.sell_price) || 0), 0);
    const totalCapital = records.reduce((t, r) => t + (Number(r.capital) || 0), 0);
    const totalMargin = totalSales - totalCapital;
    const totalCommission = records.reduce((t, r) => t + (Number(r.commission) || 0), 0);

    // per admin
    const perAdmin: Record<string, { sales: number; tx: number; commission: number }> = {};
    for (const r of records) {
      const id = r.admin_id;
      perAdmin[id] ??= { sales: 0, tx: 0, commission: 0 };
      perAdmin[id].sales += Number(r.sell_price) || 0;
      perAdmin[id].commission += Number(r.commission) || 0;
      perAdmin[id].tx += 1;
    }
    return { totalSales, totalCapital, totalMargin, totalCommission, perAdmin };
  }, [records, role]);

  // ---------- add/edit ----------
  function openNew() {
    setEditing(null);
    setForm({
      product: "",
      plan_type: "",
      duration_months: 1,
      price: "" as any,
      capital: "" as any,
      status: "available",
    });
    setShowEdit(true);
  }

  function openEdit(a: Account) {
    setEditing(a);
    setForm({
      product: a.product,
      plan_type: a.plan_type || "",
      duration_months: a.duration_months,
      price: (a.price as any) ?? "",
      capital: (a.capital as any) ?? "",
      status: a.status,
    });
    setShowEdit(true);
  }

  async function saveAccount() {
    setBusy(true);
    try {
      const payload = {
        product: form.product.trim(),
        plan_type: form.plan_type.trim() || null,
        duration_months: Number(form.duration_months || 1),
        price: form.price === "" ? null : Number(form.price),
        capital: form.capital === "" ? null : Number(form.capital),
        status: form.status,
      };
      if (editing) {
        const { error } = await supabase.from("accounts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accounts").insert(payload);
        if (error) throw error;
      }
      setShowEdit(false);
      await fetchAll();
    } catch (e: any) {
      alert(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  // ---------- sell ----------
  function openSell(a: Account) {
    setSellAcc(a);
    setSell({
      buyer_username: "",
      duration_days: 30,
      extra_days: 0,
      sell_price: (a.price as any) ?? "",
      capital: (a.capital as any) ?? "",
    });
    setShowSell(true);
  }

  const commissionPreview = useMemo(() => {
    const s = Number(sell.sell_price || 0);
    const c = Number(sell.capital || 0);
    const margin = Math.max(s - c, 0);
    return { margin, commission: margin * 0.25 };
  }, [sell.sell_price, sell.capital]);

  async function confirmSell() {
    if (!uid || !sellAcc) return;
    if (!sell.buyer_username.trim()) {
      alert("Buyer username is required.");
      return;
    }
    setBusy(true);
    try {
      // 1) record
      const { error: rErr } = await supabase.from("account_records").insert({
        account_id: sellAcc.id,
        product: sellAcc.product,
        buyer_username: sell.buyer_username.trim(),
        admin_id: uid,
        duration_days: Number(sell.duration_days || 0),
        extra_days: Number(sell.extra_days || 0),
        sell_price: sell.sell_price === "" ? null : Number(sell.sell_price),
        capital: sell.capital === "" ? null : Number(sell.capital),
      });
      if (rErr) throw rErr;

      // 2) mark as sold
      const { error: uErr } = await supabase.from("accounts").update({ status: "sold" }).eq("id", sellAcc.id);
      if (uErr) throw uErr;

      setShowSell(false);
      await fetchAll();
    } catch (e: any) {
      alert(e.message || "Failed to sell");
    } finally {
      setBusy(false);
    }
  }

  // ---------- render ----------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">📦 Admin Stock Panel</h1>

      {/* Owner summary */}
      {role === "owner" && ownerSummary && (
        <div className="grid md:grid-cols-4 gap-3 mb-5">
          <SummaryCard title="Gross Sales" value={`₱${ownerSummary.totalSales.toFixed(2)}`} />
          <SummaryCard title="Capital" value={`₱${ownerSummary.totalCapital.toFixed(2)}`} />
          <SummaryCard title="Margin" value={`₱${ownerSummary.totalMargin.toFixed(2)}`} />
          <SummaryCard title="Commissions" value={`₱${ownerSummary.totalCommission.toFixed(2)}`} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <input
          className="border p-2 rounded w-64"
          placeholder="Search product or plan…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
        </select>

        <button onClick={openNew} className="ml-auto bg-green-600 text-white px-4 py-2 rounded">
          ➕ Add New
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Product</th>
                <th className="p-2 border">Plan</th>
                <th className="p-2 border">Duration (mo)</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Capital</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border w-56">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border p-2">{a.product}</td>
                  <td className="border p-2">{a.plan_type || "-"}</td>
                  <td className="border p-2">{a.duration_months}</td>
                  <td className="border p-2">{a.price != null ? `₱${a.price}` : "-"}</td>
                  <td className="border p-2">{a.capital != null ? `₱${a.capital}` : "-"}</td>
                  <td className={`border p-2 font-semibold ${a.status === "sold" ? "text-red-600" : "text-green-700"}`}>
                    {a.status}
                  </td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(a)} className="px-2 py-1 bg-blue-500 text-white rounded">
                        ✏️ Edit
                      </button>
                      {a.status === "available" && (
                        <button onClick={() => openSell(a)} className="px-2 py-1 bg-orange-500 text-white rounded">
                          🏷️ Sell
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-3 text-center text-gray-500" colSpan={7}>
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showEdit && (
        <Modal title={editing ? "Edit Account" : "Add Account"} onClose={() => setShowEdit(false)}>
          <div className="grid gap-2">
            {/* Product dropdown */}
            <select
              className="border p-2 rounded"
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
            >
              <option value="">Select product…</option>
              {PRODUCT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <input
              className="border p-2 rounded"
              placeholder="Plan type (optional)"
              value={form.plan_type}
              onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
            />
            <input
              type="number"
              className="border p-2 rounded"
              placeholder="Duration (months)"
              value={form.duration_months}
              onChange={(e) => setForm({ ...form, duration_months: Number(e.target.value) })}
            />
            <input
              type="number"
              className="border p-2 rounded"
              placeholder="Price (sell list)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              type="number"
              className="border p-2 rounded"
              placeholder="Capital"
              value={form.capital}
              onChange={(e) => setForm({ ...form, capital: e.target.value })}
            />
            <select
              className="border p-2 rounded"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            >
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button className="px-3 py-1 rounded bg-gray-400 text-white" onClick={() => setShowEdit(false)} disabled={busy}>
              Cancel
            </button>
            <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={saveAccount} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </Modal>
      )}

      {/* Sell Modal */}
      {showSell && sellAcc && (
        <Modal title={`Sell: ${sellAcc.product}`} onClose={() => setShowSell(false)}>
          <div className="grid gap-2">
            <input
              className="border p-2 rounded"
              placeholder="Buyer username"
              value={sell.buyer_username}
              onChange={(e) => setSell({ ...sell, buyer_username: e.target.value })}
            />
            <input
              type="number"
              className="border p-2 rounded"
              placeholder="Duration days"
              value={sell.duration_days}
              onChange={(e) => setSell({ ...sell, duration_days: Number(e.target.value) })}
            />
            <input
              type="number"
              className="border p-2 rounded"
              placeholder="Extra days (optional)"
              value={sell.extra_days}
              onChange={(e) => setSell({ ...sell, extra_days: Number(e.target.value) })}
            />
            <input
              type="number"
              className="border p-2 rounded"
              placeholder="Sell price"
              value={sell.sell_price}
              onChange={(e) => setSell({ ...sell, sell_price: e.target.value })}
            />
            <input
              type="number"
              className="border p-2 rounded"
              placeholder="Capital (override if needed)"
              value={sell.capital}
              onChange={(e) => setSell({ ...sell, capital: e.target.value })}
            />

            <div className="text-sm text-gray-700">
              Margin: <b>₱{commissionPreview.margin.toFixed(2)}</b> • Commission (25%):{" "}
              <b>₱{commissionPreview.commission.toFixed(2)}</b>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button className="px-3 py-1 rounded bg-gray-400 text-white" onClick={() => setShowSell(false)} disabled={busy}>
              Cancel
            </button>
            <button className="px-3 py-1 rounded bg-orange-600 text-white" onClick={confirmSell} disabled={busy}>
              {busy ? "Saving…" : "Confirm Sell"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* --- Small UI helpers --- */
function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-[380px]">
        <div className="font-bold mb-3">{title}</div>
        {children}
        <button className="absolute top-2 right-3 text-gray-400" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}