export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          stripe_customer_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          stripe_customer_id?: string | null
          created_at?: string
        }
        Update: {
          full_name?: string | null
          stripe_customer_id?: string | null
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          full_name: string
          line1: string
          line2: string | null
          city: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          line1: string
          line2?: string | null
          city: string
          postal_code: string
          country?: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          full_name?: string
          line1?: string
          line2?: string | null
          city?: string
          postal_code?: string
          country?: string
          is_default?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          stripe_session_id: string
          printful_order_id: string | null
          status: string
          total_amount: number
          currency: string
          items: Json
          shipping_address: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          stripe_session_id: string
          printful_order_id?: string | null
          status?: string
          total_amount: number
          currency?: string
          items: Json
          shipping_address?: Json | null
          created_at?: string
        }
        Update: {
          printful_order_id?: string | null
          status?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
