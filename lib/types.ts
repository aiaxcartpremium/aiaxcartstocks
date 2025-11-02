// lib/types.ts
export type Category =
  | 'entertainment'
  | 'streaming'
  | 'educational'
  | 'editing'
  | 'ai';

export type Stock = {
  id: string;
  product: string;
  category: Category;
  status: 'available' | 'reserved' | 'sold';
  price: number | null;
  buyer_email: string | null;
  sold_at: string | null;
  created_at: string;
};

export type Role = 'owner' | 'admin';