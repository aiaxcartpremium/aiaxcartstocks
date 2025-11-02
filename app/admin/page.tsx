"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AdminPage() {
  const supabase = createClientComponentClient();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    product: "",
    plan_type: "",
    duration_months: 1,
    price: "",
    status: "available",
  });

  async function fetchAccounts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setAccounts(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  function openNew() {
    setEditing(null);
    setForm({
      product: "",
      plan_type: "",
      duration_months: 1,
      price: "",
      status: "available",
    });
    setModalOpen(true);
  }

  function openEdit(acc: any) {
    setEditing(acc);
    setForm({
      product: acc.product,
      plan_type: acc.plan_type || "",
      duration_months: acc.duration_months,
      price: acc.price,
      status: acc.status,
    });
    setModalOpen(true);
  }

  async function saveAccount() {
    const payload = {
      product: form.product,
      plan_type: form.plan_type,
      duration_months: form.duration_months,
      price: form.price,
      status: form.status,
    };

    if (editing) {
      const { error } = await supabase
        .from("accounts")
        .update(payload)
        .eq("id", editing.id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from("accounts").insert(payload);
      if (error) alert(error.message);
    }

    setModalOpen(false);
    await fetchAccounts();
  }

  async function markSold(id: number) {
    const { error } = await supabase
      .from("accounts")
      .update({ status: "sold" })
      .eq("id", id);
    if (error) alert(error.message);
    else fetchAccounts();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📦 Admin Stock Panel</h1>

      <button
        onClick={openNew}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        ➕ Add New Account
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Product</th>
              <th className="p-2 border">Plan</th>
              <th className="p-2 border">Duration (mo)</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id}>
                <td className="border p-2">{acc.product}</td>
                <td className="border p-2">{acc.plan_type || "-"}</td>
                <td className="border p-2">{acc.duration_months}</td>
                <td className="border p-2">₱{acc.price}</td>
                <td
                  className={`border p-2 font-semibold ${
                    acc.status === "sold" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {acc.status}
                </td>
                <td className="border p-2 flex gap-2 justify-center">
                  <button
                    onClick={() => openEdit(acc)}
                    className="px-2 py-1 bg-blue-500 text-white rounded"
                  >
                    ✏️ Edit
                  </button>
                  {acc.status === "available" && (
                    <button
                      onClick={() => markSold(acc.id)}
                      className="px-2 py-1 bg-orange-500 text-white rounded"
                    >
                      🏷️ Sold
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h2 className="font-bold mb-2">
              {editing ? "Edit Account" : "Add Account"}
            </h2>
            <input
              placeholder="Product"
              className="border w-full mb-2 p-2"
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
            />
            <input
              placeholder="Plan Type"
              className="border w-full mb-2 p-2"
              value={form.plan_type}
              onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
            />
            <input
              type="number"
              placeholder="Duration (months)"
              className="border w-full mb-2 p-2"
              value={form.duration_months}
              onChange={(e) =>
                setForm({ ...form, duration_months: Number(e.target.value) })
              }
            />
            <input
              type="number"
              placeholder="Price"
              className="border w-full mb-2 p-2"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
            />
            <select
              className="border w-full mb-4 p-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="bg-gray-400 px-3 py-1 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveAccount}
                className="bg-green-600 px-3 py-1 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}