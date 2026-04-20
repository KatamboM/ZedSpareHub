import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Part = {
  id: number
  sku_id: string
  part_name: string
  category: string
  part_number: string
  car_make: string
  car_model: string
  engine_code: string
  year_range: string
  seller: string
  qty_in_stock: number
  sell_price_zmw: number | null
  status: string
  notes: string | null
}

export type Order = {
  id?: number
  buyer_name: string
  buyer_phone: string
  buyer_location: string
  part_sku_id: string
  part_name: string
  part_number: string
  seller: string
  sell_price_zmw: number | null
  delivery_zone: string
  notes: string | null
  status: string
  created_at?: string
}
