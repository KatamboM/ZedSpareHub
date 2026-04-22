'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const POPULAR = [
  'Fuel Pump', 'Ball Joint', 'Tie Rod', 'Air Filter',
  'Brake Pads', 'Control Arm', 'Shock Absorber', 'Oil Filter',
]

const MAKES = [
  { name: 'Toyota',     count: '180+' },
  { name: 'Mitsubishi', count: '40+' },
  { name: 'Nissan',     count: '35+' },
  { name: 'Honda',      count: '10+' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <main>
      {/* ── Hero ── */}
      <section style={{
        minHeight: '82vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* background grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px),
                            linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.4,
        }} />
        {/* amber glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(240,165,0,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '80px', paddingBottom: '80px' }}>
          {/* eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '2px', background: 'var(--amber)' }} />
            <span className="mono text-xs text-amber" style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Lusaka · Zambia
            </span>
          </div>

          <h1 className="display fade-up" style={{ fontSize: 'clamp(56px, 10vw, 120px)', marginBottom: '24px' }}>
            FIND EVERY<br />
            <span style={{ WebkitTextStroke: '2px var(--amber)', color: 'transparent' }}>
              PART
            </span>{' '}
            FAST
          </h1>

          <p style={{ fontSize: '18px', color: 'var(--steel-light)', maxWidth: '520px', lineHeight: 1.6, marginBottom: '48px' }}>
            Search by part name, number, car model, or engine code. 
            Genuine parts from verified Lusaka sellers, delivered to your door.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="search-wrap" style={{ flex: 1, minWidth: '260px' }}>
                <input
                  className="search-input"
                  style={{ fontSize: '17px', padding: '18px 56px 18px 22px' }}
                  placeholder="e.g. Fuel pump, 23221-74021, Vitz 1NZ..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                />
                <span className="search-icon">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
              </div>
              <button type="submit" className="btn btn-amber" style={{ padding: '18px 32px', fontSize: '16px' }}>
                Search
              </button>
            </div>

            {/* Popular searches */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px', alignItems: 'center' }}>
              <span className="text-xs text-steel mono" style={{ letterSpacing: '0.1em' }}>POPULAR:</span>
              {POPULAR.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setQuery(p); router.push(`/search?q=${encodeURIComponent(p)}`) }}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '100px',
                    padding: '5px 14px',
                    fontSize: '12px',
                    color: 'var(--steel-light)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLButtonElement).style.borderColor = 'var(--amber)'
                    ;(e.target as HTMLButtonElement).style.color = 'var(--amber)'
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLButtonElement).style.borderColor = 'var(--border)'
                    ;(e.target as HTMLButtonElement).style.color = 'var(--steel-light)'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="container" style={{ padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            {[
              { n: '288+', label: 'Parts in Stock' },
              { n: '24',   label: 'Categories' },
              { n: 'COD',  label: 'Cash on Delivery' },
              { n: 'LKS',  label: 'Lusaka Delivery' },
            ].map(s => (
              <div key={s.n} style={{ padding: '28px 16px', textAlign: 'center' }}>
                <div className="display text-amber" style={{ fontSize: '36px' }}>{s.n}</div>
                <div className="text-xs text-steel mono" style={{ letterSpacing: '0.12em', marginTop: '4px', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Makes grid ── */}
      <section className="container" style={{ padding: '80px 24px' }}>
        <div style={{ marginBottom: '40px' }}>
          <span className="mono text-xs text-amber" style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>Browse by make</span>
          <h2 className="display" style={{ fontSize: '48px', marginTop: '8px' }}>SHOP BY BRAND</h2>
        </div>
        <div className="grid-4">
          {MAKES.map(m => (
            <a
              key={m.name}
              href={`/search?make=${encodeURIComponent(m.name)}`}
              className="card"
              style={{ padding: '32px 24px', textDecoration: 'none', display: 'block' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚗</div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{m.name}</div>
              <div className="text-sm text-amber" style={{ marginTop: '4px' }}>{m.count} parts</div>
            </a>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '80px 0' }}>
        <div className="container" style={{ padding: '0 24px' }}>
          <div style={{ marginBottom: '48px' }}>
            <span className="mono text-xs text-amber" style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>Simple process</span>
            <h2 className="display" style={{ fontSize: '48px', marginTop: '8px' }}>HOW IT WORKS</h2>
          </div>
          <div className="grid-3">
            {[
              { n: '01', title: 'Search', desc: 'Find your part by name, number, car model, or engine code.' },
              { n: '02', title: 'Order',  desc: 'Place your order. We confirm stock and delivery cost with you.' },
              { n: '03', title: 'Deliver',desc: 'Pay cash on delivery. We handle the whole thing.' },
            ].map(s => (
              <div key={s.n} style={{ padding: '8px' }}>
                <div className="display text-amber" style={{ fontSize: '64px', opacity: 0.4 }}>{s.n}</div>
                <h3 className="display" style={{ fontSize: '28px', marginTop: '8px' }}>{s.title.toUpperCase()}</h3>
                <p className="text-steel" style={{ marginTop: '12px', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 className="display" style={{ fontSize: 'clamp(40px,6vw,72px)' }}>READY TO FIND<br />YOUR PART?</h2>
        <p className="text-steel" style={{ marginTop: '16px', fontSize: '17px' }}>288 parts in stock. More arriving soon.</p>
        <a href="/search" className="btn btn-amber mt-32" style={{ fontSize: '16px', padding: '16px 40px' }}>
          Browse All Parts →
        </a>
      </section>
    </main>
  )
}
