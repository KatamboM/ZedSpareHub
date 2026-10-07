'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type SellerProfile = { user_id: string; store_name: string; status: 'pending' | 'approved' | 'suspended' }
type SellerPart = { id: number; sku_id: string; part_name: string; part_number: string | null; car_make: string | null; car_model: string | null; engine_code: string | null; qty_in_stock: number | null; sell_price_zmw: number | null; status: string }
type SellerOrder = { id: number; order_group_id: string | null; buyer_name: string; buyer_phone: string; buyer_location: string; part_name: string | null; quantity: number; sell_price_zmw: number | null; status: string; created_at: string }

const orderStatuses = ['Request Received', 'Seller Confirmed', 'Dispatched', 'Delivered', 'Closed', 'Cancelled']

export default function SellerAccountPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [products, setProducts] = useState<SellerPart[]>([])
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [newPart, setNewPart] = useState({ part_name: '', category: '', part_number: '', car_make: '', car_model: '', engine_code: '', year_range: '', qty_in_stock: '1', sell_price_zmw: '' })

  const loadDashboard = useCallback(async (id: string) => {
    setUserId(id)
    const { data: seller } = await supabase.from('seller_profiles').select('user_id,store_name,status').eq('user_id', id).maybeSingle()
    setProfile(seller as SellerProfile | null)
    if (!seller || seller.status !== 'approved') {
      setProducts([])
      setOrders([])
      return
    }
    const [partsResult, ordersResult] = await Promise.all([
      supabase.from('parts').select('id,sku_id,part_name,part_number,car_make,car_model,engine_code,qty_in_stock,sell_price_zmw,status').eq('seller_user_id', id).order('created_at', { ascending: false }),
      supabase.from('orders').select('id,order_group_id,buyer_name,buyer_phone,buyer_location,part_name,quantity,sell_price_zmw,status,created_at').eq('seller_user_id', id).order('created_at', { ascending: false }).limit(50),
    ])
    if (partsResult.error || ordersResult.error) setMessage('We could not load all seller information. Refresh the page or contact support.')
    setProducts((partsResult.data || []) as SellerPart[])
    setOrders((ordersResult.data || []) as SellerOrder[])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) void loadDashboard(data.user.id)
    })
  }, [loadDashboard])

  async function authenticate(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const result = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password })
    setBusy(false)
    if (result.error) {
      setMessage(result.error.message)
      return
    }
    if (!result.data.user) {
      setMessage('Check your email to confirm your account, then sign in here.')
      return
    }
    await loadDashboard(result.data.user.id)
    if (authMode === 'signup') setMessage('Account created. Seller dashboard access is enabled after your shop is approved.')
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUserId('')
    setProfile(null)
    setProducts([])
    setOrders([])
    setMessage('')
  }

  async function addPart(event: React.FormEvent) {
    event.preventDefault()
    if (!profile || !userId) return
    setBusy(true)
    setMessage('')
    const sku = `ZSH-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`
    const { error } = await supabase.from('parts').insert({
      sku_id: sku,
      part_name: newPart.part_name.trim(),
      category: newPart.category.trim(),
      part_number: newPart.part_number.trim() || null,
      car_make: newPart.car_make.trim() || null,
      car_model: newPart.car_model.trim() || null,
      engine_code: newPart.engine_code.trim() || null,
      year_range: newPart.year_range.trim() || null,
      seller: profile.store_name,
      seller_user_id: userId,
      qty_in_stock: Number(newPart.qty_in_stock),
      sell_price_zmw: newPart.sell_price_zmw ? Number(newPart.sell_price_zmw) : null,
      status: 'In Stock',
    })
    setBusy(false)
    if (error) {
      setMessage('Could not save this listing. Check the details and try again.')
      return
    }
    setNewPart({ part_name: '', category: '', part_number: '', car_make: '', car_model: '', engine_code: '', year_range: '', qty_in_stock: '1', sell_price_zmw: '' })
    await loadDashboard(userId)
  }

  async function toggleStock(item: SellerPart) {
    if (!userId) return
    const nextStatus = item.status === 'In Stock' ? 'Out of Stock' : 'In Stock'
    const nextQty = nextStatus === 'Out of Stock' ? 0 : Math.max(1, item.qty_in_stock || 1)
    const { error } = await supabase.from('parts').update({ status: nextStatus, qty_in_stock: nextQty }).eq('id', item.id).eq('seller_user_id', userId)
    if (error) setMessage('Could not update this listing. Try again.')
    else await loadDashboard(userId)
  }

  async function updateOrder(orderId: number, status: string) {
    if (!userId) return
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId).eq('seller_user_id', userId)
    if (error) setMessage('Could not update the order. Try again.')
    else await loadDashboard(userId)
  }

  return (
    <main className="container" style={{ paddingTop: 42, paddingBottom: 80 }}>
      {!profile?.status || profile.status !== 'approved' ? (
        <div className="seller-account-wrap">
          <section>
            <p className="mono text-amber text-xs" style={{ letterSpacing: '.12em' }}>SELLER CENTRE</p>
            <h1 className="display" style={{ fontSize: 46, marginTop: 8 }}>YOUR SHOP,<br />ON ZEDSPAREHUB</h1>
            <p className="text-sm text-steel" style={{ lineHeight: 1.8, maxWidth: 480, marginTop: 16 }}>Apply first, then sign in after we approve your shop. Approved sellers can manage live listings and respond to buyer orders here.</p>
            <a href="/sell" className="btn btn-amber" style={{ marginTop: 22 }}>Apply to become a seller</a>
          </section>
          <form className="card" style={{ padding: 26 }} onSubmit={authenticate}>
            <h2 className="display" style={{ fontSize: 28 }}>{authMode === 'login' ? 'SELLER LOGIN' : 'CREATE YOUR LOGIN'}</h2>
            <p className="text-xs text-steel" style={{ margin: '8px 0 20px' }}>Dashboard access is enabled only after seller approval.</p>
            <div className="form-group">
              <label className="form-label" htmlFor="seller-login-email">Email</label>
              <input id="seller-login-email" className="form-input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" htmlFor="seller-login-password">Password</label>
              <input id="seller-login-password" className="form-input" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={8} value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {message && <p className="text-sm text-steel" role="status" style={{ marginTop: 12 }}>{message}</p>}
            <button className="btn btn-amber btn-full" disabled={busy} style={{ marginTop: 18 }}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}</button>
            <button type="button" className="seller-mode-toggle" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setMessage('') }}>
              {authMode === 'login' ? 'Need a login? Create an account' : 'Already registered? Sign in'}
            </button>
            {userId && !profile && <p className="seller-pending" role="status">Your account is signed in but is not yet linked to an approved seller profile. We’ll enable access after your application is approved.</p>}
            {profile?.status === 'pending' && <p className="seller-pending" role="status">Your seller profile is still pending approval.</p>}
            {profile?.status === 'suspended' && <p className="seller-pending" role="status">Seller access is paused. Please contact ZedSpareHub.</p>}
          </form>
        </div>
      ) : (
        <>
          <div className="seller-dashboard-heading">
            <div>
              <p className="mono text-amber text-xs" style={{ letterSpacing: '.12em' }}>APPROVED SELLER</p>
              <h1 className="display" style={{ fontSize: 42, marginTop: 8 }}>{profile.store_name.toUpperCase()}</h1>
              <p className="text-sm text-steel" style={{ marginTop: 6 }}>Manage availability and follow incoming orders.</p>
            </div>
            <button type="button" className="btn btn-ghost" onClick={signOut}>Sign out</button>
          </div>

          {message && <p role="status" className="seller-pending" style={{ marginBottom: 18 }}>{message}</p>}

          <div className="seller-dashboard-grid">
            <form className="card seller-add-form" onSubmit={addPart}>
              <h2 className="display" style={{ fontSize: 24 }}>ADD A PART</h2>
              <p className="text-xs text-steel" style={{ margin: '6px 0 18px' }}>Use exact part numbers and fitment details where you have them.</p>
              <div className="seller-two-col">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-part-name">Part name *</label>
                  <input id="new-part-name" className="form-input" value={newPart.part_name} onChange={e => setNewPart({ ...newPart, part_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-part-category">Category *</label>
                  <input id="new-part-category" className="form-input" value={newPart.category} onChange={e => setNewPart({ ...newPart, category: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-part-number">Part number</label>
                  <input id="new-part-number" className="form-input" value={newPart.part_number} onChange={e => setNewPart({ ...newPart, part_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-part-make">Car make</label>
                  <input id="new-part-make" className="form-input" value={newPart.car_make} onChange={e => setNewPart({ ...newPart, car_make: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-part-model">Car model</label>
                  <input id="new-part-model" className="form-input" value={newPart.car_model} onChange={e => setNewPart({ ...newPart, car_model: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-part-engine">Engine code</label>
                  <input id="new-part-engine" className="form-input" value={newPart.engine_code} onChange={e => setNewPart({ ...newPart, engine_code: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-part-year">Year range</label>
                  <input id="new-part-year" className="form-input" placeholder="e.g. 2008–2012" value={newPart.year_range} onChange={e => setNewPart({ ...newPart, year_range: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-part-qty">Quantity *</label>
                  <input id="new-part-qty" className="form-input" type="number" min="1" value={newPart.qty_in_stock} onChange={e => setNewPart({ ...newPart, qty_in_stock: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-part-price">Price (ZMW)</label>
                  <input id="new-part-price" className="form-input" type="number" min="0" step="0.01" value={newPart.sell_price_zmw} onChange={e => setNewPart({ ...newPart, sell_price_zmw: e.target.value })} />
                </div>
              </div>
              <button className="btn btn-amber" disabled={busy} style={{ marginTop: 18 }}>{busy ? 'Saving…' : 'Add listing'}</button>
            </form>

            <section className="card seller-list-section">
              <h2 className="display" style={{ fontSize: 24 }}>YOUR LISTINGS <span className="text-amber">{products.length}</span></h2>
              <div className="seller-list">
                {products.length ? products.map(item => (
                  <article className="seller-listing" key={item.id}>
                    <div>
                      <p className="fw-600">{item.part_name}</p>
                      <p className="text-xs text-steel" style={{ marginTop: 4 }}>{[item.part_number, item.car_make, item.car_model, item.engine_code].filter(Boolean).join(' · ') || item.sku_id}</p>
                      <p className="text-xs text-steel" style={{ marginTop: 4 }}>Qty {item.qty_in_stock || 0} · {item.sell_price_zmw ? `K${Number(item.sell_price_zmw).toLocaleString()}` : 'Price to confirm'}</p>
                    </div>
                    <button type="button" className="seller-stock-toggle" onClick={() => void toggleStock(item)}>{item.status === 'In Stock' ? 'Mark out of stock' : 'Mark in stock'}</button>
                  </article>
                )) : <p className="text-sm text-steel" style={{ padding: '16px 0' }}>No listings yet. Add your first fast-moving parts above.</p>}
              </div>
            </section>
          </div>

          <section className="card seller-orders-section" style={{ padding: 22, marginTop: 20 }}>
            <h2 className="display" style={{ fontSize: 24 }}>INCOMING ORDERS <span className="text-amber">{orders.length}</span></h2>
            {orders.length ? (
              <div className="seller-orders-list">
                {orders.map(order => (
                  <article className="seller-order" key={order.id}>
                    <div>
                      <p className="fw-600">{order.part_name || 'Part request'} · Qty {order.quantity} · {order.sell_price_zmw ? `K${(Number(order.sell_price_zmw) * order.quantity).toLocaleString()}` : 'Price to confirm'}</p>
                      <p className="text-xs text-steel" style={{ marginTop: 5 }}>{order.buyer_name} · {order.buyer_phone} · {order.buyer_location}</p>
                      <p className="mono text-xs text-amber" style={{ marginTop: 5 }}>{order.order_group_id || `Order #${order.id}`} · {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <select className="form-select seller-order-status" value={order.status} onChange={e => void updateOrder(order.id, e.target.value)}>
                      {orderStatuses.map(value => <option key={value}>{value}</option>)}
                    </select>
                  </article>
                ))}
              </div>
            ) : <p className="text-sm text-steel" style={{ marginTop: 10 }}>New buyer orders for your listings will appear here.</p>}
          </section>
        </>
      )}
      <style jsx>{`
        .seller-account-wrap { display: grid; grid-template-columns: minmax(0,1fr) minmax(340px,.8fr); gap: 28px; align-items: start; }
        .seller-mode-toggle { display: block; border: 0; background: transparent; color: var(--amber); cursor: pointer; font: inherit; font-size: 12px; margin: 16px auto 0; }
        .seller-pending { display: block; margin-top: 14px; color: var(--steel-light); background: rgba(240,165,0,.08); border: 1px solid rgba(240,165,0,.2); padding: 12px 14px; border-radius: 6px; font-size: 12px; line-height: 1.6; }
        .seller-dashboard-heading { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 24px; }
        .seller-dashboard-grid { display: grid; grid-template-columns: minmax(340px,.95fr) minmax(0,1.05fr); gap: 18px; align-items: start; }
        .seller-add-form, .seller-list-section { padding: 22px; }
        .seller-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .seller-list { margin-top: 12px; }
        .seller-listing, .seller-order { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-top: 1px solid var(--border); padding: 14px 0; }
        .seller-stock-toggle { border: 1px solid var(--border); border-radius: 4px; background: transparent; color: var(--steel-light); padding: 8px 10px; font-size: 11px; cursor: pointer; flex-shrink: 0; }
        .seller-stock-toggle:hover { border-color: var(--amber); color: var(--amber); }
        .seller-orders-list { margin-top: 12px; }
        .seller-order-status { width: 180px; flex-shrink: 0; }
        @media (max-width: 850px) { .seller-account-wrap, .seller-dashboard-grid { grid-template-columns: 1fr; } }
        @media (max-width: 560px) { .seller-two-col { grid-template-columns: 1fr; } .seller-dashboard-heading, .seller-listing, .seller-order { align-items: flex-start; flex-direction: column; } .seller-order-status { width: 100%; } }
      `}</style>
    </main>
  )
}
