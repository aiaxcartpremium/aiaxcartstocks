'use client';
import { useState } from 'react';

const PRODUCT_CATEGORIES = [
  'entertainment',
  'educational',
  'productivity',
  'streaming',
  'gaming',
];

const PRODUCT_STATUSES = ['available', 'sold', 'archived'];

export default function AdminPage() {
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="flex gap-4 mb-6">
        <select className="border rounded px-2 py-1 text-sm" value={category} onChange={(e)=>setCategory(e.target.value)}>
  <option value="all">All categories</option>
  {PRODUCT_CATEGORIES.map((c) => (
    <option key={c} value={c}>{c}</option>
  ))}
</select>

<select className="border rounded px-2 py-1 text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}>
  <option value="all">All status</option>
  {STATUS_OPTIONS.map((s) => (
    <option key={s} value={s}>{s}</option>
  ))}
</select>
      </div>

      <p className="text-gray-600 text-sm">
        Showing products under <b>{category}</b> ({status})
      </p>
    </div>
  );
}