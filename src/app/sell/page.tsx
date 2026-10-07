'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const categories = ['Toyota parts', 'Honda parts', 'Nissan parts', 'Mitsubishi parts', 'Electrical', 'Engine parts', 'Suspension and steering', 'Body and lighting', 'Other']

export default function BecomeSellerPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [form, setForm] = useState({ store_name: '', contact_name: '', email: '', phone: '', whatsapp_phone: '', location: '', estimated_sku_count: '', social_link: '', message: '' })

  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }))

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (selected.length === 0) return
    setStatus('loading')
    const { error } = await supabase.from('seller_applications').insert({
      store_name: form.store_name.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      whatsapp_phone: form.whatsapp_phone.trim() || null,
      location: form.location.trim(),
      categories: selected,
      estimated_sku_count: form.estimated_sku_count ? Number(form.estimated_sku_count) : null,
      social_link: form.social_link.trim() || null,
      message: form.message.trim() || null,
      status: 'pending',
    })
    setStatus(error ? 'error' : 'success')
  }

  if (status === 'success') {
    return (
      <main className="container" style={{ maxWidth: 760, paddingTop: 56, paddingBottom: 80 }}>
        <section className="card" style={{ padding: 32 }}>
          <span className="badge badge-green">Application sent</span>
          <h1 className="display" style={{ fontSize: 38, marginTop: 16 }}>THANK YOU, {form.store_name.toUpperCase()}</h1>
          <p className="text-sm text-steel" style={{ lineHeight: 1.75, marginTop: 12 }}>We’ll review the shop details and contact you about the pilot. Seller accounts are approved before they can manage listings, so your stock remains under your control until onboarding is agreed.</p>
          <a href="/" className="btn btn-amber" style={{ marginTop: 24 }}>Back to ZedSpareHub</a>
        </section>
      </main>
    )
  }

  return (
    <main className="container" style={{ paddingTop: 42, paddingBottom: 80 }}>
      <div className="seller-apply-grid">
        <section>
          <p className="mono text-amber text-xs" style={{ letterSpacing: '.12em' }}>FOR LUSAKA PARTS SHOPS</p>
          <h1 className="display" style={{ fontSize: 48, marginTop: 8, lineHeight: .95 }}>BRING YOUR STOCK<br />ONLINE</h1>
          <p className="text-sm text-steel" style={{ lineHeight: 1.8, maxWidth: 560, marginTop: 18 }}>ZedSpareHub helps buyers find local parts by part name, number, vehicle and engine. Apply to join the seller pilot. We’ll help capture your first listings and confirm how orders and delivery will work before your shop goes live.</p>
          <div className="card" style={{ padding: 20, marginTop: 24, maxWidth: 560 }}>
            <h2 className="display" style={{ fontSize: 22 }}>WHAT HAPPENS NEXT</h2>
            <ol className="seller-next-steps">
              <li><span>01</span> Send your shop details.</li>
              <li><span>02</span> We contact you and verify the shop.</li>
              <li><span>03</span> We agree which fast-moving stock to list.</li>
              <li><span>04</span> Your seller account is enabled after approval.</li>
            </ol>
            <p className="text-xs text-steel" style={{ marginTop: 14 }}>No monthly subscription is required for the pilot. Any commission or delivery terms are agreed with you before listings go live.</p>
          </div>
        </section>

        <form className="card" style={{ padding: 24 }} onSubmit={submit}>
          <h2 className="display" style={{ fontSize: 26 }}>SELLER APPLICATION</h2>
          <p className="text-xs text-steel" style={{ margin: '6px 0 20px' }}>A few details so we can follow up with the right person.</p>
          <div className="form-group">
            <label className="form-label" htmlFor="seller-store">Shop name *</label>
            <input id="seller-store" className="form-input" value={form.store_name} onChange={e => update('store_name', e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginTop: 13 }}>
            <label className="form-label" htmlFor="seller-contact">Contact person *</label>
            <input id="seller-contact" className="form-input" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} required />
          </div>
          <div className="seller-form-row" style={{ marginTop: 13 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="seller-email">Email *</label>
              <input id="seller-email" className="form-input" type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="seller-phone">Phone *</label>
              <input id="seller-phone" className="form-input" type="tel" autoComplete="tel" value={form.phone} onChange={e => update('phone', e.target.value)} required />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 13 }}>
            <label className="form-label" htmlFor="seller-whatsapp">WhatsApp number (if different)</label>
            <input id="seller-whatsapp" className="form-input" type="tel" value={form.whatsapp_phone} onChange={e => update('whatsapp_phone', e.target.value)} />
          </div>
          <div className="form-group" style={{ marginTop: 13 }}>
            <label className="form-label" htmlFor="seller-location">Shop location *</label>
            <input id="seller-location" className="form-input" placeholder="Area, street or landmark" value={form.location} onChange={e => update('location', e.target.value)} required />
          </div>
          <fieldset className="seller-categories" style={{ marginTop: 18 }}>
            <legend className="form-label">Main stock categories *</legend>
            <div className="seller-category-grid">
              {categories.map(category => (
                <label key={category}>
                  <input type="checkbox" checked={selected.includes(category)} onChange={e => setSelected(current => e.target.checked ? [...current, category] : current.filter(value => value !== category))} />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="seller-form-row" style={{ marginTop: 13 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="seller-count">Approximate number of parts</label>
              <input id="seller-count" className="form-input" type="number" min="1" value={form.estimated_sku_count} onChange={e => update('estimated_sku_count', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="seller-social">Facebook or catalogue link</label>
              <input id="seller-social" className="form-input" type="url" placeholder="https://" value={form.social_link} onChange={e => update('social_link', e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 13 }}>
            <label className="form-label" htmlFor="seller-message">Anything else we should know?</label>
            <textarea id="seller-message" className="form-textarea" value={form.message} onChange={e => update('message', e.target.value)} />
          </div>
          {selected.length === 0 && <p className="text-xs text-steel" style={{ marginTop: 10 }}>Choose at least one stock category.</p>}
          {status === 'error' && <p className="text-sm" role="alert" style={{ color: 'var(--red)', marginTop: 12 }}>The application could not be sent. Please try again or contact us on WhatsApp.</p>}
          <button className="btn btn-amber btn-full" disabled={status === 'loading' || selected.length === 0} style={{ marginTop: 18 }}>{status === 'loading' ? 'Sending…' : 'Submit Application'}</button>
        </form>
      </div>
      <style jsx>{`
        .seller-apply-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(360px,.9fr); gap: 28px; align-items: start; }
        .seller-next-steps { list-style: none; display: grid; gap: 12px; margin-top: 18px; color: var(--steel-light); font-size: 13px; }
        .seller-next-steps li { display: flex; gap: 12px; align-items: center; }
        .seller-next-steps span { color: var(--amber); font-family: 'DM Mono', monospace; font-size: 11px; }
        .seller-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .seller-categories { border: 0; padding: 0; min-width: 0; }
        .seller-category-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 10px; }
        .seller-category-grid label { display: flex; align-items: center; gap: 8px; color: var(--steel-light); font-size: 12px; }
        .seller-category-grid input { accent-color: var(--amber); }
        @media (max-width: 820px) { .seller-apply-grid { grid-template-columns: 1fr; } }
        @media (max-width: 500px) { .seller-form-row, .seller-category-grid { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  )
}
