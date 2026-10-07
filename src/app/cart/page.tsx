'use client'

import { useEffect, useMemo, useState } from 'react'
import { clearCart, getCart, saveCart, type CartItem } from '@/lib/cart'
import { supabase } from '@/lib/supabase'

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [form, setForm] = useState({ buyer_name: '', buyer_phone: '', buyer_location: '', delivery_zone: 'Zone A (CBD) K50-80', notes: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [reference, setReference] = useState('')

  useEffect(() => {
    setItems(getCart())
    const refresh = () => setItems(getCart())
    window.addEventListener('zedspare:cart-updated', refresh)
    return () => window.removeEventListener('zedspare:cart-updated', refresh)
  }, [])

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.sell_price_zmw || 0) * item.quantity, 0), [items])
  const updateItems = (next: CartItem[]) => {
    setItems(next)
    saveCart(next)
  }

  const setQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return
    updateItems(items.map(item => item.id === id ? { ...item, quantity: Math.min(quantity, 20) } : item))
  }

  const checkout = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!items.length || !form.buyer_name.trim() || !form.buyer_phone.trim() || !form.buyer_location.trim()) return
    setStatus('loading')
    const orderGroupId = window.crypto?.randomUUID?.() || `ZSH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const rows = items.map(item => ({
      buyer_name: form.buyer_name.trim(),
      buyer_phone: form.buyer_phone.trim(),
      buyer_location: form.buyer_location.trim(),
      part_sku_id: item.sku_id,
      quantity: item.quantity,
      part_name: item.part_name,
      part_number: item.part_number,
      seller: item.seller,
      sell_price_zmw: item.sell_price_zmw,
      delivery_zone: form.delivery_zone,
      notes: form.notes.trim() || null,
      status: 'Request Received',
      order_group_id: orderGroupId,
      seller_user_id: item.seller_user_id,
    }))
    const { error } = await supabase.from('orders').insert(rows)
    if (error) {
      setStatus('error')
      return
    }
    setReference(orderGroupId)
    clearCart()
    setItems([])
    setStatus('success')
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 72 }}>
      <div style={{ marginBottom: 32 }}>
        <p className="mono text-amber text-xs" style={{ letterSpacing: '.12em' }}>YOUR SELECTION</p>
        <h1 className="display" style={{ fontSize: 42, marginTop: 8 }}>SHOPPING CART</h1>
        <p className="text-sm text-steel" style={{ marginTop: 8 }}>Submit one COD request for the parts you want. We’ll confirm stock before dispatch.</p>
      </div>

      {status === 'success' ? (
        <section className="card" style={{ maxWidth: 680, padding: 32 }}>
          <p className="badge badge-green">Request received</p>
          <h2 className="display" style={{ fontSize: 30, marginTop: 16 }}>WE’LL CONFIRM YOUR PARTS</h2>
          <p className="text-sm text-steel" style={{ marginTop: 12, lineHeight: 1.7 }}>We’ll call {form.buyer_phone} to confirm availability, delivery and payment on delivery.</p>
          <p className="mono text-amber text-sm" style={{ marginTop: 18 }}>Order reference: {reference}</p>
          <a href="/search" className="btn btn-amber" style={{ marginTop: 24 }}>Browse more parts</a>
        </section>
      ) : items.length === 0 ? (
        <section className="card" style={{ maxWidth: 680, padding: 32 }}>
          <h2 className="display" style={{ fontSize: 28 }}>YOUR CART IS EMPTY</h2>
          <p className="text-sm text-steel" style={{ marginTop: 10 }}>Browse parts and add available items to your cart.</p>
          <a href="/search" className="btn btn-amber" style={{ marginTop: 24 }}>Browse Parts</a>
        </section>
      ) : (
        <div className="cart-layout">
          <section>
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map(item => (
                <article className="card cart-item" key={item.id} style={{ padding: 18 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="fw-600">{item.part_name}</p>
                    <p className="mono text-xs text-amber" style={{ marginTop: 6 }}>{item.part_number || item.sku_id}</p>
                    <p className="text-xs text-steel" style={{ marginTop: 6 }}>{[item.car_make, item.car_model, item.engine_code].filter(Boolean).join(' · ')}</p>
                    <p className="text-xs text-steel" style={{ marginTop: 5 }}>Seller: {item.seller || 'To be confirmed'}</p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 116 }}>
                    <p className="fw-600">{item.sell_price_zmw ? `K${(item.sell_price_zmw * item.quantity).toLocaleString()}` : 'Price to confirm'}</p>
                    <div className="cart-quantity" style={{ marginTop: 10 }}>
                      <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => setQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button type="button" className="cart-remove" onClick={() => updateItems(items.filter(entry => entry.id !== item.id))}>Remove</button>
                  </div>
                </article>
              ))}
            </div>
            <div className="card" style={{ padding: 20, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span className="text-steel">Parts subtotal</span><strong>{subtotal ? `K${subtotal.toLocaleString()}` : 'Confirmed by phone'}</strong>
              </div>
              <p className="text-xs text-steel" style={{ marginTop: 8 }}>Delivery fee is confirmed based on your location. Cash on delivery.</p>
            </div>
          </section>

          <form className="card" style={{ padding: 24, alignSelf: 'start' }} onSubmit={checkout}>
            <h2 className="display" style={{ fontSize: 26 }}>DELIVERY DETAILS</h2>
            <p className="text-xs text-steel" style={{ margin: '6px 0 20px' }}>No payment is taken online.</p>
            <div className="form-group">
              <label className="form-label" htmlFor="cart-name">Your name *</label>
              <input id="cart-name" className="form-input" autoComplete="name" value={form.buyer_name} onChange={e => setForm({ ...form, buyer_name: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" htmlFor="cart-phone">Phone number *</label>
              <input id="cart-phone" className="form-input" type="tel" autoComplete="tel" value={form.buyer_phone} onChange={e => setForm({ ...form, buyer_phone: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" htmlFor="cart-location">Delivery location *</label>
              <input id="cart-location" className="form-input" autoComplete="street-address" placeholder="Area or landmark in Lusaka" value={form.buyer_location} onChange={e => setForm({ ...form, buyer_location: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" htmlFor="cart-zone">Delivery zone</label>
              <select id="cart-zone" className="form-select" value={form.delivery_zone} onChange={e => setForm({ ...form, delivery_zone: e.target.value })}>
                <option>Zone A (CBD) K50-80</option>
                <option>Zone B (Suburbs) K100-150</option>
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" htmlFor="cart-notes">Vehicle or order notes</label>
              <textarea id="cart-notes" className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Add your vehicle details or anything we should know" />
            </div>
            {status === 'error' && <p role="alert" className="text-sm" style={{ color: 'var(--red)', marginTop: 12 }}>We couldn’t submit this request. Please try again or contact us on WhatsApp.</p>}
            <button className="btn btn-amber btn-full" style={{ marginTop: 18 }} disabled={status === 'loading'}>{status === 'loading' ? 'Sending request…' : 'Place COD Request'}</button>
          </form>
        </div>
      )}

      <style jsx>{`
        .cart-layout { display: grid; grid-template-columns: minmax(0,1.3fr) minmax(300px,.7fr); gap: 20px; align-items: start; }
        .cart-item { display: flex; gap: 16px; justify-content: space-between; }
        .cart-quantity { display: inline-flex; border: 1px solid var(--border); border-radius: 5px; align-items: center; }
        .cart-quantity button { width: 30px; height: 28px; border: 0; background: transparent; color: var(--white); cursor: pointer; font-size: 16px; }
        .cart-quantity span { min-width: 26px; text-align: center; font-size: 13px; }
        .cart-remove { display: block; border: 0; background: transparent; color: var(--steel); cursor: pointer; font-size: 11px; margin: 6px 0 0 auto; text-decoration: underline; }
        @media (max-width: 800px) { .cart-layout { grid-template-columns: 1fr; } }
        @media (max-width: 500px) { .cart-item { padding: 14px !important; gap: 8px; } }
      `}</style>
    </main>
  )
}
