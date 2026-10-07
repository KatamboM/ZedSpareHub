'use client'

import { useState } from 'react'
import { addToCart } from '@/lib/cart'
import type { Part } from '@/lib/supabase'

export default function AddToCartButton({ part }: { part: Part }) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addToCart({
      id: part.id,
      sku_id: part.sku_id,
      part_name: part.part_name,
      part_number: part.part_number,
      category: part.category,
      car_make: part.car_make,
      car_model: part.car_model,
      engine_code: part.engine_code,
      seller: part.seller,
      seller_user_id: part.seller_user_id || null,
      sell_price_zmw: part.sell_price_zmw,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  const available = ['In Stock', 'Low Stock'].includes(part.status) && part.qty_in_stock > 0

  return (
    <button type="button" className="btn btn-ghost btn-full" onClick={handleAdd} disabled={!available}>
      {added ? 'Added to cart ✓' : available ? 'Add to Cart' : 'Coming Soon'}
    </button>
  )
}
