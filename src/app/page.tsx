'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const POPULAR = [
  'Fuel Pump', 'Ball Joint', 'Tie Rod', 'Air Filter',
  'Brake Pads', 'Control Arm', 'Shock Absorber', 'Oil Filter',
]

const MAKES = [
  { name: 'Toyota',     count: '180+', flag: '🇯🇵' },
  { name: 'Mitsubishi', count: '40+',  flag: '🇯🇵' },
  { name: 'Nissan',     count: '35+',  flag: '🇯🇵' },
  { name: 'Honda',      count: '10+',  flag: '🇯🇵' },
]

const TICKER_ITEMS = [
  'GENUINE PARTS ONLY', 'LUSAKA DELIVERY', 'CASH ON DELIVERY',
  '288+ PARTS IN STOCK', 'TOYOTA · NISSAN · HONDA · MITSUBISHI',
  'PARTS AT YOUR CONVENIENCE', 'SAME-DAY DISPATCH',
]

// ─── Animated counter hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return value
}

// ─── Inline styles as a style tag ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --amber: #F0A500;
    --amber-dim: rgba(240,165,0,0.12);
    --amber-glow: rgba(240,165,0,0.35);
    --surface: #0a0a0b;
    --surface-2: #111113;
    --surface-3: #1a1a1e;
    --border: rgba(255,255,255,0.07);
    --border-amber: rgba(240,165,0,0.25);
    --text: #f0ede8;
    --steel: #6b6b75;
    --steel-light: #a0a0ab;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .zsh-page {
    background: var(--surface);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33%       { transform: translateY(-14px) rotate(1.5deg); }
    66%       { transform: translateY(-6px) rotate(-1deg); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.8); opacity: 0.6; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes scan {
    0%   { background-position: 0% 0%; }
    100% { background-position: 0% 100%; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes borderPulse {
    0%, 100% { border-color: var(--border-amber); }
    50%       { border-color: var(--amber); }
  }

  .animate-fade-up   { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.35s; }
  .delay-4 { animation-delay: 0.5s; }
  .delay-5 { animation-delay: 0.65s; }

  /* ── Ticker ── */
  .ticker-wrap {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--surface-2);
    overflow: hidden;
    white-space: nowrap;
    padding: 13px 0;
  }
  .ticker-inner {
    display: inline-flex;
    gap: 0;
    animation: ticker 28s linear infinite;
  }
  .ticker-item {
    display: inline-flex;
    align-items: center;
    gap: 20px;
    padding: 0 32px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.16em;
    color: var(--steel);
    text-transform: uppercase;
  }
  .ticker-dot {
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--amber);
    opacity: 0.7;
    flex-shrink: 0;
  }

  /* ── Hero ── */
  .hero {
    position: relative;
    min-height: 90vh;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
  }

  .hero-glow-1 {
    position: absolute;
    top: 10%; left: 55%;
    width: 700px; height: 500px;
    background: radial-gradient(ellipse, rgba(240,165,0,0.09) 0%, transparent 65%);
    pointer-events: none;
    animation: float 8s ease-in-out infinite;
  }
  .hero-glow-2 {
    position: absolute;
    bottom: 20%; left: 10%;
    width: 400px; height: 300px;
    background: radial-gradient(ellipse, rgba(240,165,0,0.05) 0%, transparent 65%);
    pointer-events: none;
    animation: float 12s ease-in-out infinite reverse;
  }

  .hero-scan-line {
    position: absolute; inset: 0;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(240,165,0,0.015) 50%,
      transparent 100%
    );
    background-size: 100% 200px;
    animation: scan 6s linear infinite;
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 100px 40px 80px;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px 6px 6px;
    border: 1px solid var(--border-amber);
    border-radius: 100px;
    background: rgba(240,165,0,0.06);
    margin-bottom: 32px;
  }
  .eyebrow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--amber);
    position: relative;
  }
  .eyebrow-dot::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1px solid var(--amber);
    animation: pulse-ring 2s ease-out infinite;
  }
  .eyebrow-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--amber);
  }

  .hero-headline {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(72px, 12vw, 148px);
    line-height: 0.92;
    letter-spacing: -0.01em;
    margin-bottom: 28px;
  }
  .hero-headline .outline-word {
    -webkit-text-stroke: 2px var(--amber);
    color: transparent;
    position: relative;
  }
  .hero-headline .shimmer-word {
    background: linear-gradient(
      90deg,
      var(--amber) 0%,
      #fff5cc 35%,
      var(--amber) 55%,
      #c47d00 80%,
      var(--amber) 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3.5s linear infinite;
    animation-delay: 1s;
  }

  .hero-sub {
    font-size: 17px;
    color: var(--steel-light);
    max-width: 500px;
    line-height: 1.65;
    margin-bottom: 48px;
    font-weight: 300;
  }

  /* ── Search ── */
  .search-form { max-width: 620px; }
  .search-row { display: flex; gap: 12px; flex-wrap: wrap; }
  .search-box {
    flex: 1;
    min-width: 260px;
    position: relative;
  }
  .search-input-field {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px 56px 18px 22px;
    font-size: 16px;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    backdrop-filter: blur(8px);
  }
  .search-input-field::placeholder { color: var(--steel); }
  .search-input-field:focus {
    border-color: var(--amber);
    background: rgba(240,165,0,0.04);
    box-shadow: 0 0 0 4px rgba(240,165,0,0.08), 0 1px 32px rgba(240,165,0,0.06);
  }
  .search-icon-wrap {
    position: absolute;
    right: 18px; top: 50%;
    transform: translateY(-50%);
    color: var(--steel);
    pointer-events: none;
  }
  .search-btn {
    padding: 18px 32px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    letter-spacing: 0.04em;
    background: var(--amber);
    color: #000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
    white-space: nowrap;
  }
  .search-btn:hover {
    background: #ffc62b;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(240,165,0,0.3);
  }
  .search-btn:active { transform: translateY(0); }

  .popular-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 20px;
    align-items: center;
  }
  .popular-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--steel);
    text-transform: uppercase;
  }
  .popular-chip {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 5px 14px;
    font-size: 12px;
    color: var(--steel-light);
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .popular-chip:hover {
    border-color: var(--amber);
    color: var(--amber);
    background: rgba(240,165,0,0.07);
    transform: translateY(-1px);
  }

  /* ── Stats ── */
  .stats-strip {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--surface-2);
    position: relative;
    overflow: hidden;
  }
  .stats-strip::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(240,165,0,0.03), transparent);
  }
  .stats-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 40px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
  }
  .stat-item {
    padding: 36px 24px;
    text-align: center;
    position: relative;
    transition: background 0.2s;
  }
  .stat-item:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0; top: 25%; bottom: 25%;
    width: 1px;
    background: var(--border);
  }
  .stat-item:hover { background: rgba(240,165,0,0.03); }
  .stat-number {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 48px;
    color: var(--amber);
    line-height: 1;
    letter-spacing: 0.02em;
  }
  .stat-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--steel);
    text-transform: uppercase;
    margin-top: 6px;
  }

  /* ── Makes ── */
  .section {
    max-width: 1280px;
    margin: 0 auto;
    padding: 96px 40px;
  }
  .section-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--amber);
    margin-bottom: 12px;
  }
  .section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(40px, 5vw, 64px);
    line-height: 1;
    margin-bottom: 48px;
  }

  .makes-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .make-card {
    display: block;
    padding: 36px 28px;
    text-decoration: none;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: var(--surface-2);
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    cursor: pointer;
  }
  .make-card::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(240,165,0,0.06) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .make-card::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--amber), transparent);
    transform: scaleX(0);
    transition: transform 0.3s;
  }
  .make-card:hover {
    border-color: var(--border-amber);
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px var(--border-amber);
  }
  .make-card:hover::before { opacity: 1; }
  .make-card:hover::after { transform: scaleX(1); }

  .make-icon {
    font-size: 36px;
    margin-bottom: 16px;
    filter: grayscale(0.2);
    transition: transform 0.3s;
  }
  .make-card:hover .make-icon { transform: scale(1.1) rotate(-3deg); }

  .make-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 0.02em;
    margin-bottom: 6px;
    color: var(--text);
  }
  .make-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--amber);
    letter-spacing: 0.06em;
  }
  .make-arrow {
    position: absolute;
    top: 28px; right: 24px;
    font-size: 18px;
    color: var(--steel);
    transition: all 0.3s;
    transform: rotate(-45deg);
  }
  .make-card:hover .make-arrow {
    color: var(--amber);
    transform: rotate(-45deg) translate(3px, -3px);
  }

  /* ── How it works ── */
  .how-section {
    background: var(--surface-2);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .how-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
  }
  .how-item {
    padding: 56px 40px;
    position: relative;
    transition: background 0.25s;
  }
  .how-item:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0; top: 20%; bottom: 20%;
    width: 1px;
    background: var(--border);
  }
  .how-item:hover { background: rgba(240,165,0,0.02); }

  .how-number {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 96px;
    line-height: 1;
    color: var(--amber);
    opacity: 0.15;
    transition: opacity 0.3s;
    margin-bottom: -8px;
  }
  .how-item:hover .how-number { opacity: 0.3; }

  .how-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 36px;
    letter-spacing: 0.02em;
    margin-bottom: 16px;
    color: var(--text);
  }
  .how-desc {
    font-size: 15px;
    color: var(--steel-light);
    line-height: 1.7;
    font-weight: 300;
    max-width: 260px;
  }
  .how-connector {
    position: absolute;
    right: -16px; top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--surface-2);
    border: 1px solid var(--border-amber);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    color: var(--amber);
  }

  /* ── CTA ── */
  .cta-section {
    max-width: 1280px;
    margin: 0 auto;
    padding: 120px 40px;
    text-align: center;
    position: relative;
  }
  .cta-glow {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 500px; height: 300px;
    background: radial-gradient(ellipse, rgba(240,165,0,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .cta-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(52px, 8vw, 104px);
    line-height: 0.95;
    margin-bottom: 20px;
    position: relative;
  }
  .cta-sub {
    font-size: 16px;
    color: var(--steel-light);
    margin-bottom: 40px;
    font-weight: 300;
    position: relative;
  }
  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 18px 44px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--amber);
    color: #000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
    position: relative;
    animation: borderPulse 3s ease-in-out infinite;
  }
  .cta-btn:hover {
    background: #ffc62b;
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(240,165,0,0.35);
  }
  .cta-btn .arrow {
    transition: transform 0.2s;
    font-size: 18px;
  }
  .cta-btn:hover .arrow { transform: translateX(4px); }

  /* ── Trust bar ── */
  .trust-bar {
    border-top: 1px solid var(--border);
    background: var(--surface-2);
    padding: 20px 40px;
    display: flex;
    justify-content: center;
    gap: 40px;
    flex-wrap: wrap;
  }
  .trust-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--steel);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .trust-icon { font-size: 16px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .makes-grid { grid-template-columns: repeat(2, 1fr); }
    .how-grid { grid-template-columns: 1fr; }
    .how-item:not(:last-child)::after { display: none; }
    .stats-inner { grid-template-columns: repeat(2, 1fr); }
    .stats-inner .stat-item:nth-child(2)::after { display: none; }
    .stats-inner .stat-item:nth-child(3)::after { display: none; }
  }
  @media (max-width: 600px) {
    .hero-content { padding: 80px 24px 60px; }
    .makes-grid { grid-template-columns: 1fr 1fr; }
    .section { padding: 64px 24px; }
    .stats-inner { padding: 0 24px; grid-template-columns: repeat(2, 1fr); }
    .trust-bar { padding: 20px 24px; gap: 20px; }
    .cta-section { padding: 80px 24px; }
  }
`

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [query, setQuery] = useState('')
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const count288 = useCountUp(288, 1800, statsVisible)
  const count24  = useCountUp(24,  1400, statsVisible)
  const count27  = useCountUp(27,  1500, statsVisible)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true) },
      { threshold: 0.4 }
    )
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const goSearch = (term: string) => {
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <div className="zsh-page">
      <style>{CSS}</style>

      {/* ── Ticker ─────────────────────────────────────────────────── */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />
        <div className="hero-scan-line" />

        <div className="hero-content">
          {/* Eyebrow */}
          <div className="eyebrow animate-fade-up delay-1">
            <span className="eyebrow-dot" />
            <span className="eyebrow-text">Lusaka · Zambia · Est 2026</span>
          </div>

          {/* Headline */}
          <h1 className="hero-headline animate-fade-up delay-2">
            FIND EVERY<br />
            <span className="shimmer-word">PART</span>{' '}
            <span className="outline-word">FAST</span>
          </h1>

          {/* Subheading */}
          <p className="hero-sub animate-fade-up delay-3">
            Search by part name, OEM number, car model, or engine code.
            Genuine parts from verified Lusaka sellers — delivered to your door.
          </p>

          {/* Search */}
          <form className="search-form animate-fade-up delay-4" onSubmit={handleSearch}>
            <div className="search-row">
              <div className="search-box">
                <input
                  className="search-input-field"
                  placeholder="e.g. Fuel pump, 23221-74021, Vitz 1NZ..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                />
                <span className="search-icon-wrap">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
              </div>
              <button type="submit" className="search-btn">Search →</button>
            </div>

            <div className="popular-row">
              <span className="popular-label">Popular:</span>
              {POPULAR.map(p => (
                <button
                  key={p}
                  type="button"
                  className="popular-chip"
                  onClick={() => goSearch(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="stats-strip" ref={statsRef}>
        <div className="stats-inner">
          <div className="stat-item">
            <div className="stat-number">{statsVisible ? count288 : 0}+</div>
            <div className="stat-label">Parts in Stock</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{statsVisible ? count24 : 0}</div>
            <div className="stat-label">Categories</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">COD</div>
            <div className="stat-label">Cash on Delivery</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{statsVisible ? count27 : 0}YR</div>
            <div className="stat-label">In Business</div>
          </div>
        </div>
      </div>

      {/* ── Makes ──────────────────────────────────────────────────── */}
      <div className="section">
        <p className="section-eyebrow">Browse by make</p>
        <h2 className="section-title">SHOP BY BRAND</h2>
        <div className="makes-grid">
          {MAKES.map(m => (
            <a
              key={m.name}
              href={`/search?make=${encodeURIComponent(m.name)}`}
              className="make-card"
            >
              <div className="make-arrow">↗</div>
              <div className="make-icon">{m.flag} 🚗</div>
              <div className="make-name">{m.name.toUpperCase()}</div>
              <div className="make-count">{m.count} parts available</div>
            </a>
          ))}
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────── */}
      <div className="how-section">
        <div className="section">
          <p className="section-eyebrow">Simple process</p>
          <h2 className="section-title">HOW IT WORKS</h2>
          <div className="how-grid">
            {[
              { n: '01', title: 'Search',  desc: 'Find your part by name, OEM number, car model, or engine code. Instant results from live stock.' },
              { n: '02', title: 'Order',   desc: 'Place your order. We confirm stock availability and delivery cost with you directly.' },
              { n: '03', title: 'Deliver', desc: 'Pay cash on delivery. We handle the whole logistics chain — no upfront payment needed.' },
            ].map((s, i) => (
              <div key={s.n} className="how-item" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="how-number">{s.n}</div>
                <h3 className="how-title">{s.title.toUpperCase()}</h3>
                <p className="how-desc">{s.desc}</p>
                {i < 2 && <span className="how-connector">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <div className="cta-section">
        <div className="cta-glow" />
        <h2 className="cta-title">READY TO FIND<br />YOUR PART?</h2>
        <p className="cta-sub">288+ parts in stock. Genuine Suppliers. Stock updated weekly.</p>
        <a href="/search" className="cta-btn">
          Browse All Parts
          <span className="arrow">→</span>
        </a>
      </div>

      {/* ── Trust bar ──────────────────────────────────────────────── */}
      <div className="trust-bar">
        {[
          { icon: '✓', text: 'Quality Parts From Verified Sellers' },
          { icon: '🚚', text: 'Lusaka Delivery' },
          { icon: '💵', text: 'Easy Price Access' },
          { icon: '🛡', text: 'Multiple Trusted Sellers' },
          { icon: '📞', text: 'WhatsApp Support' },
        ].map(t => (
          <div key={t.text} className="trust-item">
            <span className="trust-icon">{t.icon}</span>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
