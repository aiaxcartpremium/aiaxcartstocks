export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; role: 'owner'|'admin'; created_at: string; };
        Insert: { id: string; full_name?: string | null; role?: 'owner'|'admin'; created_at?: string; };
        Update: { full_name?: string | null; role?: 'owner'|'admin'; };
      };
      accounts: {
        Row: {
          id: number; service: string; email: string; password: string;
          profile: string | null; pin: string | null;
          capital: number; price: number; status: 'available'|'sold';
          date_added: string; sold_by: string | null; sold_at: string | null;
        };
        Insert: {
          service: string; email: string; password: string; profile?: string | null; pin?: string | null;
          capital: number; price: number; status?: 'available'|'sold';
        };
        Update: Partial<Database['public']['Tables']['accounts']['Row']>;
      };
      account_records: {
        Row: {
          id: number; account_id: number | null; product: string; buyer_username: string; admin_id: string;
          availed_at: string; duration_days: number; extra_days: number; expires_at: string;
        };
        Insert: {
          account_id?: number | null; product: string; buyer_username: string; admin_id: string;
          availed_at?: string; duration_days?: number; extra_days?: number;
        };
        Update: Partial<Database['public']['Tables']['account_records']['Row']>;
      };
    };
    Views: {
      account_sales: {
        Row: { id: number; service: string; price: number; capital: number; gross_profit: number;
               commission_rate: number; commission: number; sold_by: string | null; sold_at: string | null; }
      };
      sales_per_admin: {
        Row: { admin_id: string; admin_name: string; items_sold: number; total_gross_profit: number; total_commission: number; }
      };
      account_records_with_admin: {
        Row: Database['public']['Tables']['account_records']['Row'] & { admin_name: string | null };
      };
      records_expiring_48h: {
        Row: Database['public']['Tables']['account_records']['Row'];
      };
    };
  };
};