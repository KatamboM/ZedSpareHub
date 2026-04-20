'use client'
import { useState } from 'react'
import { supabase, type Part } from '@/lib/supabase'

export default function OrderForm({ part }: { part: Part }) {
  const [form, setForm] = useState({
    buyer_name: '',
    buyer_phone: '',
    buyer_location: '',
    delivery_zone: 'Zone A (CBD) K50-80',
    notes: '',
  })
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.buyer_name || !form.buyer_phone || !form.buyer_location) return
    setStatus('loading')

    const { error } = await supabase.from('orders').insert({
      buyer_name:     form.buyer_name,
      buyer_phone:    form.buyer_phone,
      buyer_location: form.buyer_location,
      part_sku_id:    part.sku_id,
      part_name:      part.part_name,
      part_number:    part.part_number,
      seller:         part.seller,
      sell_price_zmw: part.sell_price_zmw,
      delivery_zone:  form.delivery_zone,
      notes:          form.notes || null,
      status:         'Request Received',
    })

    setStatus(error ? 'error' : 'success')
  }

  if (status === 'success') {
    return (
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid rgba(45,184,122,0.3)',
        borderRadius: '12px',
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3 className="display" style={{ fontSize: '28px', color: 'var(--green)' }}>ORDER RECEIVED</h3>
        <p className="text-steel mt-16" style={{ lineHeight: 1.6 }}>
          We'll confirm stock and call you at <strong style={{ color: 'var(--white)' }}>{form.buyer_phone}</strong> within 30 minutes to confirm delivery.
        </p>
        <p className="text-xs text-steel mono mt-16" style={{ letterSpacing: '0.08em' }}>CASH ON DELIVERY · NO UPFRONT PAYMENT</p>
        <a href="/search" className="btn btn-ghost btn-full mt-32">Browse More Parts</a>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '32px',
    }}>
      <h3 className="display" style={{ fontSize: '28px', marginBottom: '4px' }}>ORDER THIS PART</h3>
      <p className="text-sm text-steel" style={{ marginBottom: '24px' }}>We'll call to confirm. Cash on delivery.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Your Name *</label>
          <input className="form-input" placeholder="Full name" value={form.buyer_name} onChange={e => set('buyer_name', e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input className="form-input" placeholder="09X XXX XXXX" type="tel" value={form.buyer_phone} onChange={e => set('buyer_phone', e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Delivery Location *</label>
          <input className="form-input" placeholder="e.g. Woodlands, Kabulonga..." value={form.buyer_location} onChange={e => set('buyer_location', e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Delivery Zone</label>
          <select className="form-select" value={form.delivery_zone} onChange={e => set('delivery_zone', e.target.value)}>
            <option>Zone A (CBD) K50-80</option>
            <option>Zone B (Suburbs) K100-150</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-textarea" placeholder="Any specific details about your car or the part needed..." value={form.notes} onChange={e => set('notes', e.target.value)} style={{ minHeight: '80px' }} />
        </div>

        {/* Part summary */}
        <div style={{
          background: 'var(--surface-3)',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '13px',
          color: 'var(--steel)',
        }}>
          <p style={{ marginBottom: '4px' }}>
            <span style={{ color: 'var(--white)', fontWeight: 600 }}>{part.part_name}</span>
          </p>
          <p className="mono text-amber" style={{ fontSize: '12px' }}>{part.part_number}</p>
          {part.sell_price_zmw && (
            <p style={{ marginTop: '8px' }}>
              Part: <strong style={{ color: 'var(--white)' }}>K{part.sell_price_zmw.toLocaleString()}</strong>
              {' '}+ delivery fee
            </p>
          )}
        </div>

        {status === 'error' && (
          <p className="text-sm" style={{ color: 'var(--red)' }}>Something went wrong. Please try again or call us directly.</p>
        )}

        <button
          onClick={handleSubmit}
          className="btn btn-amber btn-full"
          style={{ marginTop: '8px', padding: '16px', fontSize: '16px' }}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Placing Order...' : 'Place Order →'}
        </button>

        <p className="text-xs text-steel" style={{ textAlign: 'center' }}>
          No payment now · We call to confirm · COD only
        </p>
      </div>
    </div>
  )
}
