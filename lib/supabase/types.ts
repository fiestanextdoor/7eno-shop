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
          fulfillments: Json
          customer_email: string | null
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
          fulfillments?: Json
          customer_email?: string | null
          created_at?: string
        }
        Update: {
          printful_order_id?: string | null
          status?: string
          fulfillments?: Json
          customer_email?: string | null
        }
      }
      coupon_redemptions: {
        Row: {
          id: string
          user_id: string
          code: string
          stripe_session_id: string | null
          redeemed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          stripe_session_id?: string | null
          redeemed_at?: string
        }
        Update: {
          code?: string
          stripe_session_id?: string | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type CouponRedemption = Database['public']['Tables']['coupon_redemptions']['Row']

/**
 * Eén fulfillment binnen een order. Een order (één Stripe-sessie) kan door meer
 * providers worden vervuld, dus dit staat als jsonb-array in orders.fulfillments.
 * De tracking-velden worden gevuld door de provider-webhooks bij verzending.
 */
export interface Fulfillment {
  provider: string
  order_id: string
  status: string
  tracking_number?: string | null
  tracking_url?: string | null
  carrier?: string | null
  shipped_at?: string | null
}
