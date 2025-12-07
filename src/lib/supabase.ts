import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          pin_hash: string;
          display_name: string;
          session_timeout_minutes: number;
          last_activity: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      purchase_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['purchase_accounts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['purchase_accounts']['Insert']>;
      };
      phones: {
        Row: {
          id: string;
          user_id: string;
          model: string;
          storage: string;
          color: string;
          imei: string;
          condition: string;
          purchase_price: number;
          purchase_date: string;
          purchase_account_id: string | null;
          notes: string;
          sale_price: number | null;
          sale_date: string | null;
          is_sold: boolean;
          qr_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['phones']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['phones']['Insert']>;
      };
      repairs: {
        Row: {
          id: string;
          phone_id: string;
          user_id: string;
          description: string;
          repair_list: string;
          cost: number;
          status: 'pending' | 'in_progress' | 'completed' | 'failed';
          technician: string | null;
          photo_url: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['repairs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['repairs']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          ip_address: string | null;
          user_agent: string | null;
          metadata: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
};
