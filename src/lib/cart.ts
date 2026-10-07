export type CartItem = {
  id: number
  sku_id: string
  part_name: string
  part_number: string | null
  category: string | null
  car_make: string | null
  car_model: string | null
  engine_code: string | null
  seller: string | null
  seller_user_id: string | null
  sell_price_zmw: number | null
  quantity: number
}

const CART_KEY = 'zedsparehub-cart'

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(window.localStorage.getItem(CART_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('zedspare:cart-updated'))
}

export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const items = getCart()
  const existing = items.find(entry => entry.id === item.id)
  if (existing) existing.quantity += 1
  else items.push({ ...item, quantity: 1 })
  saveCart(items)
}

export function clearCart() {
  saveCart([])
}
