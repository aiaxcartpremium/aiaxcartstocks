"use client";

import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Account = {
  id: number;
  product: string;
  plan_type: string | null;
  duration_months: number;
  price: number | null;
  status: "available" | "sold";
  created_at: string;
};

export default function AdminPage() {
  const supabase = createClientComponentClient();
  const [me, setMe] = useState<{ id: string } | null>(null);

  // table data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // search + filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "available" | "sold">("all");

  // add/edit modal
  const [editing, setEditing] = useState<Account | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    product: "",
    plan_type: "",
    duration_months: 1,
    price: "" as any,
    status: "available" as "available" | "sold",
  });

  // sell modal
  const [sellAcc, setSellAcc] = useState<Account | null>(null);
  const [showSell, setShowSell] = useState(false);
  const [sell, setSell] = useState({
    buyer_username: "",
    duration_days: 30,
    extra_days: 0,
  });
  const [busy, setBusy] = useState(false);

  // ---------- session ----------
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id || null;
      if (!uid) return; // login page should handle redirect
      setMe({ id: uid });
    })();
  }, [supabase]);

  // ---------- fetch ----------
  async function fetchAccounts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setAccounts((data || []) as Account[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

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

  // ---------- add/edit ----------
  function openNew() {
    setEditing(null);
    setForm({
      product: "",
      plan_type: "",
      duration_months: 1,
      price: "" as any,
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
      status: a.status,
    });
    setShowEdit(true);
  }

  async function saveAccount() {
    setBusy(true);
    const payload = {
      product: form.product.trim(),
      plan_type: form.plan_type.trim() || null,
      duration_months: Number(form.duration_months || 1),
      price: form.price === "" ? null : Number(form.price),
      status: form.status,
    };
    try {
      if (editing) {
        const { error } = await supabase
          .from("accounts")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accounts").insert(payload);
        if (error) throw error;
      }
      setShowEdit(false);
      await fetchAccounts();
    } catch (e: any) {
      alert(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  // ---------- sell ----------
  function openSell(a: Account) {
    setSellAcc(a);
    setSell({ buyer_username: "", duration_days: 30, extra_days: 0 });
    setShowSell(true);
  }

  async function confirmSell() {
    if (!me || !sellAcc) return;
    if (!sell.buyer_username.trim()) {
      alert("Buyer username is required.");
      return;
    }
    setBusy(true);
    try {
      // 1) insert into account_records
      const { error: insErr } = await supabase.from("account_records").insert({
        account_id: sellAcc.id,
        product: sellAcc.product,
        buyer_username: sell.buyer_username.trim(),
        admin_id: me.id,
        duration_days: Number(sell.duration_days || 0),
        extra_days: Number(sell.extra_days || 0),
        // availed_at defaults to now(), expires_at auto via trigger
      });
      if (insErr) throw insErr;

      // 2) update accounts.status = 'sold'
      const { error: upErr } = await supabase
        .from("accounts")
        .update({ status: "sold" })
        .eq("id", sellAcc.id);
      if (upErr) throw upErr;

      setShowSell(false);
      await fetchAccounts();
    } catch (e: any) {
      alert(e.message || "Failed to sell");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📦 Admin Stock Panel</h1>

      {/* Search + filters */}
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

        <button
          onClick={openNew}
          className="ml-auto bg-green-600 text-white px-4 py-2 rounded"
        >
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
                <th className="p-2 border">Status</th>
                <th className="p-2 border w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border p-2">{a.product}</td>
                  <td className="border p-2">{a.plan_type || "-"}</td>
                  <td className="border p-2">{a.duration_months}</td>
                  <td className="border p-2">{a.price != null ? `₱${a.price}` : "-"}</td>
                  <td
                    className={`border p-2 font-semibold ${
                      a.status === "sold" ? "text-red-600" : "text-green-700"
                    }`}
                  >
                    {a.status}
                  </td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(a)}
                        className="px-2 py-1 bg-blue-500 text-white rounded"
                      >
                        ✏️ Edit
                      </button>
                      {a.status === "available" && (
                        <button
                          onClick={() => openSell(a)}
                          className="px-2 py-1 bg-orange-500 text-white rounded"
                        >
                          🏷️ Sell
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-3 text-center text-gray-500" colSpan={6}>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="font-bold mb-3">
              {editing ? "Edit Account" : "Add Account"}
            </h2>
            <div className="grid gap-2">
              <input
                className="border p-2 rounded"
                placeholder="Product (e.g., netflix shared)"
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="Plan type (shared/solo/etc)"
                value={form.plan_type}
                onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Duration (months)"
                value={form.duration_months}
                onChange={(e) =>
                  setForm({ ...form, duration_months: Number(e.target.value) })
                }
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <select
                className="border p-2 rounded"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as any })
                }
              >
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1 rounded bg-gray-400 text-white"
                onClick={() => setShowEdit(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-green-600 text-white"
                onClick={saveAccount}
                disabled={busy}
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSell && sellAcc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="font-bold mb-2">Sell: {sellAcc.product}</h2>
            <div className="text-sm text-gray-600 mb-3">
              This will create an <b>account_record</b> and set this stock to <b>sold</b>.
            </div>

            <div className="grid gap-2">
              <input
                className="border p-2 rounded"
                placeholder="Buyer username"
                value={sell.buyer_username}
                onChange={(e) =>
                  setSell({ ...sell, buyer_username: e.target.value })
                }
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Duration days"
                value={sell.duration_days}
                onChange={(e) =>
                  setSell({ ...sell, duration_days: Number(e.target.value) })
                }
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Extra days (optional)"
                value={sell.extra_days}
                onChange={(e) =>
                  setSell({ ...sell, extra_days: Number(e.target.value) })
                }
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1 rounded bg-gray-400 text-white"
                onClick={() => setShowSell(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-orange-600 text-white"
                onClick={confirmSell}
                disabled={busy}
              >
                {busy ? "Saving…" : "Confirm Sell"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}