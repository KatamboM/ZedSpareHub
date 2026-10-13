'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────
interface VehicleMemory {
  make?: string
  model?: string
  year?: string
  lastSearch?: string
}

interface SearchSuggestion {
  text: string
  category: string
  icon: string
}

// ─── Data ────────────────────────────────────────────────────────────────────
const POPULAR_PARTS = [
  'Fuel Pump', 'Ball Joint', 'Tie Rod', 'Air Filter',
  'Brake Pads', 'Control Arm', 'Shock Absorber', 'Oil Filter',
  'Spark Plug', 'Timing Belt', 'Alternator', 'Starter Motor',
]

const MAKES = [
  { name: 'Toyota', count: 180, logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/bb2d661f28ce617dba8a51bdfc2069a3381a23b0/logos/optimized/toyota.png', color: '#EB0A1E' },
  { name: 'Mitsubishi', count: 40, logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/bb2d661f28ce617dba8a51bdfc2069a3381a23b0/logos/optimized/mitsubishi.png', color: '#E60012' },
  { name: 'Nissan', count: 35, logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/bb2d661f28ce617dba8a51bdfc2069a3381a23b0/logos/optimized/nissan.png', color: '#C3002F' },
  { name: 'Honda', count: 10, logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/bb2d661f28ce617dba8a51bdfc2069a3381a23b0/logos/optimized/honda.png', color: '#CC0000' },
  { name: 'Mazda', count: 8, logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/bb2d661f28ce617dba8a51bdfc2069a3381a23b0/logos/optimized/mazda.png', color: '#101010' },
  { name: 'Subaru', count: 5, logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/bb2d661f28ce617dba8a51bdfc2069a3381a23b0/logos/optimized/subaru.png', color: '#0033A0' },
  { name: 'Isuzu', count: 12, logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/bb2d661f28ce617dba8a51bdfc2069a3381a23b0/logos/optimized/isuzu.png', color: '#333333' },
  { name: 'Suzuki', count: 8, logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/bb2d661f28ce617dba8a51bdfc2069a3381a23b0/logos/optimized/suzuki.png', color: '#E20A17' },
]

const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { text: 'Brake pads for Toyota Hilux 2019', category: 'Popular', icon: '🔧' },
  { text: 'Oil filter 90915-YZZD2', category: 'OEM Number', icon: '#' },
  { text: 'Fuel pump 1NZ-FE engine', category: 'Engine Code', icon: '⚙️' },
  { text: 'Control arm Nissan X-Trail T32', category: 'Model Specific', icon: '🚗' },
]

const HOW_IT_WORKS = [
  { n: '01', title: 'Search', desc: 'Search by part name, OEM number, vehicle make, model, or engine code.', icon: '⌕' },
  { n: '02', title: 'Check', desc: 'Review the vehicle details on each listing. If you are unsure about fit, ask us before ordering.', icon: '✓' },
  { n: '03', title: 'Request', desc: 'Send a part request or contact us on WhatsApp to confirm availability, price, and delivery.', icon: '↗' },
]

// ─── Custom Hooks ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>()

  useEffect(() => {
    if (!start) return
    
    let startTime: number | null = null
    
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }
    
    frameRef.current = requestAnimationFrame(step)
    
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [start, target, duration])
  
  return value
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(initialValue)
  
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) setStored(JSON.parse(item))
    } catch (e) { console.warn('localStorage error:', e) }
  }, [key])
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(stored) : value
      setStored(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (e) { console.warn('localStorage set error:', e) }
  }, [key, stored])
  
  return [stored, setValue] as const
}

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])
  
  return pos
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --amber: #F0A500;
    --amber-dim: rgba(240,165,0,0.12);
    --amber-glow: rgba(240,165,0,0.35);
    --surface: #0a0a0b;
    --surface-2: #111113;
    --surface-3: #1a1a1e;
    --surface-glass: rgba(17,17,19,0.85);
    --border: rgba(255,255,255,0.07);
    --border-amber: rgba(240,165,0,0.25);
    --text: #f0ede8;
    --text-dim: rgba(240,237,232,0.7);
    --steel: #6b6b75;
    --steel-light: #a0a0ab;
    --success: #22c55e;
    --error: #ef4444;
  }

  *, *::before, *::after { 
    box-sizing: border-box; 
    margin: 0; 
    padding: 0; 
  }

  .zsh-page {
    background: var(--surface);
    color: var(--text);
    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes fadeScale {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
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
  @keyframes glowPulse {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-up { 
    animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; 
  }
  .animate-fade-scale {
    animation: fadeScale 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }
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
    padding: 14px 0;
    position: relative;
  }
  .ticker-wrap::before,
  .ticker-wrap::after {
    content: '';
    position: absolute;
    top: 0; bottom: 0;
    width: 100px;
    z-index: 2;
    pointer-events: none;
  }
  .ticker-wrap::before {
    left: 0;
    background: linear-gradient(90deg, var(--surface-2), transparent);
  }
  .ticker-wrap::after {
    right: 0;
    background: linear-gradient(270deg, var(--surface-2), transparent);
  }
  .ticker-inner {
    display: inline-flex;
    gap: 0;
    animation: ticker 35s linear infinite;
    will-change: transform;
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
    animation: glowPulse 2s ease-in-out infinite;
  }

  /* ── Hero ── */
  .hero {
    position: relative;
    min-height: 92vh;
    display: flex;
    align-items: center;
    overflow: hidden;
    contain: layout style paint;
  }

  .hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
    animation: fadeIn 1s ease-out;
  }

  .hero-glow-1 {
    position: absolute;
    top: 10%; left: 55%;
    width: 700px; height: 500px;
    background: radial-gradient(ellipse, rgba(240,165,0,0.09) 0%, transparent 65%);
    pointer-events: none;
    animation: float 8s ease-in-out infinite;
    will-change: transform;
  }
  .hero-glow-2 {
    position: absolute;
    bottom: 20%; left: 10%;
    width: 400px; height: 300px;
    background: radial-gradient(ellipse, rgba(240,165,0,0.05) 0%, transparent 65%);
    pointer-events: none;
    animation: float 12s ease-in-out infinite reverse;
    will-change: transform;
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
    backdrop-filter: blur(10px);
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
    font-family: 'Bebas Neue', Impact, sans-serif;
    font-size: clamp(64px, 11vw, 140px);
    line-height: 0.92;
    letter-spacing: -0.01em;
    margin-bottom: 28px;
    text-wrap: balance;
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
    max-width: 520px;
    line-height: 1.65;
    margin-bottom: 40px;
    font-weight: 300;
    text-wrap: pretty;
  }

  /* ── Search ── */
  .search-container { 
    max-width: 680px; 
    position: relative;
  }
  .search-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
  }
  .search-tab {
    padding: 8px 16px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    color: var(--steel);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .search-tab:hover {
    color: var(--text);
    background: rgba(255,255,255,0.04);
  }
  .search-tab.active {
    color: var(--amber);
    border-color: var(--border-amber);
    background: rgba(240,165,0,0.06);
  }
  .search-row { 
    display: flex; 
    gap: 12px; 
    flex-wrap: wrap; 
    position: relative;
  }
  .search-box {
    flex: 1;
    min-width: 260px;
    position: relative;
  }
  .search-input-field {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 14px;
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

  .search-suggestions {
    position: absolute;
    top: calc(100% + 8px);
    left: 0; right: 0;
    background: var(--surface-glass);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 8px;
    z-index: 50;
    backdrop-filter: blur(20px);
    animation: slideDown 0.2s ease-out;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  }
  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;
    color: var(--text-dim);
    font-size: 14px;
  }
  .suggestion-item:hover {
    background: rgba(240,165,0,0.08);
    color: var(--text);
  }
  .suggestion-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-3);
    border-radius: 8px;
    font-size: 14px;
  }
  .suggestion-meta {
    margin-left: auto;
    font-size: 11px;
    color: var(--steel);
    font-family: 'JetBrains Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.06em;
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
    font-weight: 600;
    letter-spacing: 0.04em;
    background: var(--amber);
    color: #000;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
    white-space: nowrap;
    position: relative;
    overflow: hidden;
  }
  .search-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s;
  }
  .search-btn:hover::before {
    transform: translateX(100%);
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
    padding: 6px 16px;
    font-size: 13px;
    color: var(--steel-light);
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
    border: 1px solid transparent;
  }
  .popular-chip:hover {
    border-color: var(--amber);
    color: var(--amber);
    background: rgba(240,165,0,0.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(240,165,0,0.1);
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
    padding: 40px 24px;
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
    font-family: 'Bebas Neue', Impact, sans-serif;
    font-size: clamp(36px, 4vw, 48px);
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
    margin-top: 8px;
  }

  /* ── Vehicle Memory Banner ── */
  .vehicle-memory {
    max-width: 1280px;
    margin: 0 auto;
    padding: 16px 40px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: var(--steel-light);
    border-bottom: 1px solid var(--border);
    background: rgba(240,165,0,0.03);
  }
  .vehicle-memory-btn {
    margin-left: auto;
    padding: 6px 14px;
    background: var(--surface-3);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--amber);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .vehicle-memory-btn:hover {
    border-color: var(--amber);
    background: rgba(240,165,0,0.1);
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
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title {
    font-family: 'Bebas Neue', Impact, sans-serif;
    font-size: clamp(40px, 5vw, 64px);
    line-height: 1;
    margin-bottom: 48px;
    text-wrap: balance;
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
    transform-style: preserve-3d;
    perspective: 1000px;
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
    width: 132px;
    height: 84px;
    padding: 10px;
    margin-bottom: 16px;
    background: #fff;
    border-radius: 12px;
    transition: transform 0.3s;
    display: inline-block;
  }
  .make-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .make-card:hover .make-icon { transform: scale(1.1) rotate(-3deg); }

  .make-name {
    font-family: 'Bebas Neue', Impact, sans-serif;
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
    opacity: 0;
    transform: translateY(20px);
  }
  .how-item.visible {
    animation: fadeUp 0.6s ease-out forwards;
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
    font-family: 'Bebas Neue', Impact, sans-serif;
    font-size: 96px;
    line-height: 1;
    color: var(--amber);
    opacity: 0.12;
    transition: opacity 0.3s;
    margin-bottom: -16px;
    user-select: none;
  }
  .how-item:hover .how-number { opacity: 0.25; }

  .how-icon {
    font-size: 32px;
    margin-bottom: 16px;
    opacity: 0.8;
  }

  .how-title {
    font-family: 'Bebas Neue', Impact, sans-serif;
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
    max-width: 280px;
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
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
    width: 600px; height: 400px;
    background: radial-gradient(ellipse, rgba(240,165,0,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .cta-title {
    font-family: 'Bebas Neue', Impact, sans-serif;
    font-size: clamp(48px, 8vw, 104px);
    line-height: 0.95;
    margin-bottom: 20px;
    position: relative;
    text-wrap: balance;
  }
  .cta-sub {
    font-size: 16px;
    color: var(--steel-light);
    margin-bottom: 40px;
    font-weight: 300;
    position: relative;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 18px 44px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--amber);
    color: #000;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
    position: relative;
    animation: borderPulse 3s ease-in-out infinite;
    overflow: hidden;
  }
  .cta-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }
  .cta-btn:hover::before {
    transform: translateX(100%);
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
    padding: 24px 40px;
    display: flex;
    justify-content: center;
    gap: 48px;
    flex-wrap: wrap;
  }
  .trust-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--steel);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .trust-icon { font-size: 18px; }

  /* ── WhatsApp Float ── */
  .whatsapp-float {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    background: #25D366;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 28px;
    text-decoration: none;
    box-shadow: 0 4px 20px rgba(37,211,102,0.4);
    transition: all 0.3s;
    z-index: 100;
    animation: fadeScale 0.5s ease-out 1s both;
  }
  .whatsapp-float:hover {
    transform: scale(1.1) rotate(-5deg);
    box-shadow: 0 8px 30px rgba(37,211,102,0.5);
  }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .makes-grid { grid-template-columns: repeat(2, 1fr); }
    .how-grid { grid-template-columns: 1fr; }
    .how-item:not(:last-child)::after { display: none; }
    .stats-inner { grid-template-columns: repeat(2, 1fr); }
    .stats-inner .stat-item:nth-child(2)::after { display: none; }
    .stats-inner .stat-item:nth-child(3)::after { display: none; }
  }
  @media (max-width: 768px) {
    .hero-content { padding: 80px 24px 60px; }
    .section { padding: 64px 24px; }
    .stats-inner { padding: 0 24px; grid-template-columns: repeat(2, 1fr); }
    .trust-bar { padding: 20px 24px; gap: 24px; }
    .cta-section { padding: 80px 24px; }
    .search-row { flex-direction: column; }
    .search-btn { width: 100%; }
    .how-item { padding: 40px 24px; }
    .vehicle-memory { flex-direction: column; text-align: center; padding: 16px 24px; }
    .vehicle-memory-btn { margin-left: 0; margin-top: 8px; }
  }
  @media (max-width: 480px) {
    .makes-grid { grid-template-columns: 1fr; }
    .stats-inner { grid-template-columns: 1fr; }
    .stats-inner .stat-item::after { display: none; }
    .trust-bar { gap: 16px; }
    .trust-item { font-size: 11px; }
  }
  /* ── Premium automotive editorial direction ── */
  .zsh-page {
    --amber: #d4af70;
    --amber-dim: rgba(212,175,112,.12);
    --amber-glow: rgba(212,175,112,.24);
    --surface: #101310;
    --surface-2: #171b17;
    --surface-3: #232923;
    --surface-glass: rgba(23,27,23,.96);
    --border: rgba(237,232,220,.12);
    --border-amber: rgba(212,175,112,.34);
    --text: #f2eee5;
    --text-dim: rgba(242,238,229,.72);
    --steel: #8c9189;
    --steel-light: #b7b9b2;
    background:
      radial-gradient(ellipse at 70% 5%, rgba(116,103,73,.11), transparent 35%),
      var(--surface);
  }
  .ticker-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    min-height: 48px;
    padding: 8px clamp(20px, 5vw, 72px);
    background: #1c211c;
    border: 0;
  }
  .ticker-wrap::before,.ticker-wrap::after { display: none; }
  .ticker-item {
    padding: 0;
    color: #cfcec5;
    font: 500 11px/1.4 'DM Sans', sans-serif;
    letter-spacing: .03em;
    text-transform: none;
    white-space: normal;
  }
  .ticker-dot { width: 6px; height: 6px; animation: none; }
  .announcement-link {
    color: var(--amber);
    font-size: 12px;
    text-decoration: none;
    white-space: nowrap;
  }
  .announcement-link:hover { color: #f1d39a; }
  .hero {
    min-height: 0;
    padding: clamp(52px, 7vw, 96px) 0 clamp(64px, 8vw, 112px);
  }
  .hero-grid {
    background-image:
      linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse 75% 85% at 70% 44%, black 20%, transparent 100%);
  }
  .hero-glow-1 {
    top: 5%; left: auto; right: 0;
    width: 55vw; height: 620px;
    background: radial-gradient(ellipse, rgba(212,175,112,.12) 0%, transparent 68%);
    animation: none;
  }
  .hero-content {
    max-width: 1360px;
    padding: 0 clamp(24px, 6vw, 88px);
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(380px, .85fr);
    align-items: center;
    gap: clamp(44px, 8vw, 120px);
  }
  .hero-copy { min-width: 0; }
  .eyebrow {
    padding: 0;
    border: 0;
    background: transparent;
    margin-bottom: 28px;
    backdrop-filter: none;
  }
  .eyebrow-dot { display:none; }
  .eyebrow-text {
    color: var(--amber);
    font: 600 11px/1.4 'DM Sans', sans-serif;
    letter-spacing: .16em;
  }
  .hero-headline {
    max-width: 760px;
    font: 500 clamp(54px, 7.2vw, 96px)/.98 'DM Sans', sans-serif;
    letter-spacing: -.065em;
    margin: 0 0 24px;
    text-wrap: balance;
  }
  .hero-headline .shimmer-word {
    color: var(--amber);
    -webkit-text-fill-color: var(--amber);
    background: none;
    animation: none;
    font-weight: 400;
  }
  .hero-sub {
    max-width: 520px;
    color: #b8bcb3;
    font-size: 16px;
    line-height: 1.75;
    margin-bottom: 30px;
  }
  .search-container { max-width: 630px; }
  .search-tabs { gap: 20px; margin-bottom: 10px; }
  .search-tab {
    padding: 8px 0;
    border-radius: 0;
    color: #9a9d96;
    font-size: 13px;
  }
  .search-tab.active {
    color: var(--amber);
    border-color: transparent;
    border-bottom: 1px solid var(--amber);
    background: transparent;
  }
  .search-input-field {
    min-height: 58px;
    background: #20251f;
    border-color: rgba(242,238,229,.15);
    border-radius: 4px;
    padding-left: 18px;
  }
  .search-input-field:focus {
    background: #242a23;
    box-shadow: 0 0 0 3px rgba(212,175,112,.12);
  }
  .search-btn {
    min-height: 58px;
    border-radius: 4px;
    padding: 0 24px;
    background: var(--amber);
    font-weight: 600;
  }
  .search-btn:hover { background: #e2c38d; box-shadow: 0 8px 24px rgba(212,175,112,.18); }
  .popular-row { gap: 7px; margin-top: 16px; }
  .popular-label {
    font: 500 10px/1.4 'DM Sans',sans-serif;
    letter-spacing: .08em;
    margin-right: 3px;
  }
  .popular-chip {
    border-radius: 3px;
    padding: 6px 10px;
    background: rgba(255,255,255,.035);
    color: #bfc1b9;
    font-size: 11px;
  }
  .popular-chip:hover { transform: none; box-shadow: none; }
  .hero-footnote {
    margin-top: 22px;
    color: #969b91;
    font-size: 12px;
    line-height: 1.5;
  }
  .hero-footnote span { color: var(--amber); margin-right: 7px; }
  .hero-feature {
    position: relative;
    padding: 18px;
    border: 1px solid rgba(228,218,195,.18);
    border-radius: 7px;
    background: linear-gradient(145deg, rgba(38,43,36,.96), rgba(22,26,22,.98));
    box-shadow: 0 32px 90px rgba(0,0,0,.36), inset 0 1px rgba(255,255,255,.045);
  }
  .feature-topline,.feature-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #9ea298;
    font: 500 10px/1.4 'DM Sans',sans-serif;
    letter-spacing: .1em;
  }
  .feature-index { color: #777d73; font-variant-numeric: tabular-nums; }
  .feature-art {
    height: clamp(220px, 27vw, 330px);
    margin: 14px 0 12px;
    display: grid;
    place-items: center;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(ellipse at 50% 54%, rgba(191,163,111,.2), transparent 55%),
      linear-gradient(135deg, #272d25, #1a201a);
  }
  .feature-art::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(135deg, rgba(255,255,255,.045), transparent 42%, rgba(0,0,0,.12));
  }
  .art-orbit {
    position: absolute;
    width: 76%;
    aspect-ratio: 1;
    border: 1px solid rgba(212,175,112,.13);
    border-radius: 50%;
  }
  .art-orbit-two { width: 56%; opacity: .6; }
  .filter-illustration { width: 94%; max-height: 100%; position: relative; z-index: 1; }
  .feature-art-caption {
    position: absolute;
    z-index: 2;
    bottom: 12px; left: 14px;
    color: rgba(240,234,220,.65);
    font: 10px 'JetBrains Mono',monospace;
    letter-spacing: .1em;
  }
  .feature-details {
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:14px;
    padding: 11px 2px 14px;
  }
  .feature-kicker {
    display:block;
    color:var(--amber);
    font:500 10px/1.4 'DM Sans',sans-serif;
    letter-spacing:.12em;
    margin-bottom:5px;
  }
  .feature-details h2 { font-size:20px; font-weight:500; letter-spacing:-.03em; }
  .coming-badge {
    display:inline-flex;
    align-items:center;
    gap:7px;
    border:1px solid rgba(212,175,112,.26);
    border-radius:3px;
    padding:7px 9px;
    color:#ddc38f;
    background:rgba(212,175,112,.07);
    font-size:10px;
    white-space:nowrap;
  }
  .coming-badge i { width:5px;height:5px;border-radius:50%;background:var(--amber); }
  .feature-footer {
    padding-top: 13px;
    border-top:1px solid var(--border);
    letter-spacing:0;
    text-transform:none;
    font-size:12px;
  }
  .feature-footer strong { color:#f2eee5;font-size:18px;font-weight:500; }
  .feature-footer a { margin-left:auto;color:var(--amber);text-decoration:none; }
  .feature-footer a:hover { color:#f1d39a; }
  .stats-strip {
    border:0;
    background:#1b201b;
  }
  .stats-inner { max-width:1360px; padding:0 clamp(24px,6vw,88px); }
  .stat-item { padding:30px 16px; }
  .stat-number {
    color:var(--text);
    font:500 clamp(28px,3.2vw,40px)/1.1 'DM Sans',sans-serif;
    letter-spacing:-.06em;
  }
  .stat-label {
    color:#999e94;
    font:500 10px/1.5 'DM Sans',sans-serif;
    letter-spacing:.08em;
    text-transform:none;
  }
  .section { max-width:1360px; padding:clamp(64px,8vw,110px) clamp(24px,6vw,88px); }
  .section-eyebrow { color:var(--amber);font:600 10px/1.4 'DM Sans',sans-serif;letter-spacing:.14em; }
  .section-title { font:500 clamp(34px,4.5vw,54px)/1.06 'DM Sans',sans-serif;letter-spacing:-.055em;margin-bottom:34px; }
  .makes-grid { gap:12px; }
  .make-card {
    border-radius:5px;
    background:linear-gradient(145deg,#1b201b,#151915);
    border-color:rgba(237,232,220,.11);
    padding:28px 24px;
  }
  .make-card:hover { transform:translateY(-2px); }
  .make-icon { width:112px;height:68px;border-radius:3px;background:#f4f1e9;padding:8px; }
  .make-name { font:500 21px 'DM Sans',sans-serif;letter-spacing:-.025em; }
  .make-count { color:#a8aa9f;font:11px 'DM Sans',sans-serif;letter-spacing:.04em; }
  .how-section { background:#171b17;border-color:var(--border); }
  .how-item { padding:44px 32px; }
  .how-number { font:400 64px/1 'DM Sans',sans-serif;letter-spacing:-.08em;color:var(--amber); }
  .how-icon { font-size:23px;color:var(--amber); }
  .how-title { font:500 23px 'DM Sans',sans-serif;letter-spacing:-.03em; }
  .how-desc { color:#aaaea4;font-size:14px;line-height:1.75; }
  .cta-section { max-width:1360px;padding:clamp(76px,9vw,120px) 24px; }
  .cta-title { font:500 clamp(42px,6vw,72px)/1.02 'DM Sans',sans-serif;letter-spacing:-.06em; }
  .cta-btn { border-radius:4px;animation:none;padding:16px 27px;font-size:12px; }
  .trust-bar { background:#171b17;border-color:var(--border);gap:clamp(18px,3vw,42px); }
  .trust-item { color:#b9bcb3;font:500 10px 'DM Sans',sans-serif;letter-spacing:.04em; }
  .whatsapp-float { border-radius:4px;box-shadow:0 8px 24px rgba(37,211,102,.2); }
  @media(max-width:900px) {
    .hero-content { grid-template-columns:1fr;gap:46px;max-width:760px; }
    .hero-feature { max-width:560px;width:100%;margin:0 auto; }
  }
  @media(max-width:768px) {
    .hero { padding:54px 0 68px; }
    .hero-content { padding:0 24px; }
    .hero-headline { font-size:clamp(52px,13vw,80px); }
    .search-row { flex-direction:row; }
    .search-btn { width:auto; }
    .popular-row { gap:6px; }
    .stat-number { font-size:clamp(24px,7vw,34px); }
    .stats-inner { padding:0 16px; }
    .stat-item { padding:23px 10px; }
    .stat-label { font-size:9px; }
    .feature-art { height:250px; }
    .section { padding:62px 24px; }
    .trust-bar { padding:22px 18px; }
    .trust-item { font-size:10px; }
  }
  @media(max-width:520px) {
    .ticker-wrap { align-items:flex-start;flex-direction:column;gap:7px;padding:11px 20px; }
    .ticker-item { font-size:10px; }
    .hero-feature { padding:12px; }
    .feature-art { height:220px; }
    .stats-inner { grid-template-columns:repeat(2,1fr); }
    .stats-inner .stat-item:nth-child(2)::after { display:none; }
    .stats-inner .stat-item:nth-child(3)::after { display:none; }
    .search-row { gap:8px; }
    .search-btn { padding:0 16px; }
    .makes-grid { grid-template-columns:repeat(2,1fr); }
    .make-card { padding:20px 15px; }
    .make-icon { width:100%;max-width:110px;height:56px; }
  }

`

// ─── Sub-components ──────────────────────────────────────────────────────────
function SearchSuggestions({ 
  query, 
  onSelect, 
  visible 
}: { 
  query: string
  onSelect: (text: string) => void
  visible: boolean 
}) {
  if (!visible || query.length < 2) return null
  
  const filtered = SEARCH_SUGGESTIONS.filter(s => 
    s.text.toLowerCase().includes(query.toLowerCase())
  )
  
  if (filtered.length === 0) return null

  return (
    <div className="search-suggestions" role="listbox">
      {filtered.map((s, i) => (
        <div 
          key={i} 
          className="suggestion-item" 
          onClick={() => onSelect(s.text)}
          role="option"
          tabIndex={0}
        >
          <span className="suggestion-icon">{s.icon}</span>
          <span>{s.text}</span>
          <span className="suggestion-meta">{s.category}</span>
        </div>
      ))}
    </div>
  )
}

function MakeCard({ make, index }: { make: typeof MAKES[0]; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [transform, setTransform] = useState('')
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTransform(`perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(10px)`)
  }
  
  const handleMouseLeave = () => setTransform('')

  return (
    <a
      ref={cardRef}
      href={`/search?make=${encodeURIComponent(make.name)}`}
      className="make-card"
      style={{ 
        animationDelay: `${index * 0.1}s`,
        transform: transform || undefined,
        transition: 'transform 0.1s ease-out, box-shadow 0.3s, border-color 0.3s'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="make-arrow">↗</div>
      <div className="make-icon">
        {/* The brand name below labels the link; the logo is decorative. */}
        <img src={make.logo} alt="" width={112} height={64} loading="lazy" decoding="async" />
      </div>
      <div className="make-name">{make.name.toUpperCase()}</div>
      <div className="make-count">Explore catalogue <span aria-hidden="true">↗</span></div>
    </a>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HomePage() {
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'part' | 'vehicle'>('part')
  const [statsVisible, setStatsVisible] = useState(false)
  const [suggestionsVisible, setSuggestionsVisible] = useState(false)
  const [vehicleMemory, setVehicleMemory] = useLocalStorage<VehicleMemory>('zsh-vehicle', {})
  
  const statsRef = useRef<HTMLDivElement>(null)
  const howRefs = useRef<(HTMLDivElement | null)[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const count288 = useCountUp(288, 1800, statsVisible)
  const count5 = useCountUp(5, 1200, statsVisible)

  // Intersection Observer for stats
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3, rootMargin: '0px 0px -50px 0px' }
    )
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  // Intersection Observer for How It Works
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.2 }
    )
    
    howRefs.current.forEach(ref => {
      if (ref) obs.observe(ref)
    })
    
    return () => obs.disconnect()
  }, [])

  // Click outside to close suggestions
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestionsVisible(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setVehicleMemory(prev => ({ ...prev, lastSearch: query.trim() }))
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const goSearch = (term: string) => {
    setQuery(term)
    setVehicleMemory(prev => ({ ...prev, lastSearch: term }))
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  const clearVehicleMemory = () => setVehicleMemory({})

  return (
    <div className="zsh-page">
      <style>{CSS}</style>

      {/* ── Catalogue announcement ── */}
      <div className="ticker-wrap" aria-label="Catalogue update">
        <span className="ticker-item">
          <span className="ticker-dot" aria-hidden="true" />
          The catalogue is nearly here. Browse listings and request a part in the meantime.
        </span>
        <a className="announcement-link" href="/search">Explore catalogue <span aria-hidden="true">↗</span></a>
      </div>

      {/* ── Vehicle Memory Banner ── */}
      {vehicleMemory.lastSearch && (
        <div className="vehicle-memory animate-fade-up">
          <span>⌕</span>
          <span>{`Last search: "${vehicleMemory.lastSearch}"`}
          <button 
            className="vehicle-memory-btn" 
            onClick={clearVehicleMemory}
            aria-label="Clear vehicle memory"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow-1" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-copy">
            <div className="eyebrow animate-fade-up delay-1">
              <span className="eyebrow-dot" aria-hidden="true" />
              <span className="eyebrow-text">Lusaka · Zambia</span>
            </div>
            <h1 className="hero-headline animate-fade-up delay-2">
              Find the right<br />
              <span className="shimmer-word">part.</span>
            </h1>
            <p className="hero-sub animate-fade-up delay-3">
              A considered catalogue of vehicle parts for Zambia. Search by part name, OEM number, make, model, or engine code.
            </p>
            <div ref={searchRef} className="search-container animate-fade-up delay-4">
              <div className="search-tabs" role="tablist" aria-label="Search type">
                <button
                  className={`search-tab ${searchMode === 'part' ? 'active' : ''}`}
                  onClick={() => setSearchMode('part')}
                  role="tab"
                  aria-selected={searchMode === 'part'}
                >Part</button>
                <button
                  className={`search-tab ${searchMode === 'vehicle' ? 'active' : ''}`}
                  onClick={() => setSearchMode('vehicle')}
                  role="tab"
                  aria-selected={searchMode === 'vehicle'}
                >Vehicle</button>
              </div>
              <form className="search-row" onSubmit={handleSearch}>
                <div className="search-box">
                  <input
                    className="search-input-field"
                    placeholder={searchMode === 'vehicle'
                      ? 'Make, model, year, or engine'
                      : 'Part name or OEM number'}
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value)
                      setSuggestionsVisible(true)
                    }}
                    onFocus={() => setSuggestionsVisible(true)}
                    aria-label={searchMode === 'vehicle' ? 'Search by vehicle' : 'Search parts'}
                  />
                  <span className="search-icon-wrap" aria-hidden="true">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </span>
                  <SearchSuggestions query={query} onSelect={goSearch} visible={suggestionsVisible && searchMode === 'part'} />
                </div>
                <button type="submit" className="search-btn">Search <span aria-hidden="true">→</span></button>
              </form>
              <div className="popular-row">
                <span className="popular-label">Popular</span>
                {POPULAR_PARTS.slice(0, 4).map(p => (
                  <button key={p} type="button" className="popular-chip" onClick={() => goSearch(p)}>{p}</button>
                ))}
              </div>
            </div>
            <p className="hero-footnote"><span aria-hidden="true">✳</span> Catalogue listings are coming soon. Check availability before ordering.</p>
          </div>

          <aside className="hero-feature animate-fade-scale delay-3" aria-label="Featured catalogue listing">
            <div className="feature-topline">
              <span>CATALOGUE PREVIEW</span>
              <span className="feature-index">01 / 288</span>
            </div>
            <div className="feature-art">
              <div className="art-orbit art-orbit-one" aria-hidden="true" />
              <div className="art-orbit art-orbit-two" aria-hidden="true" />
              <svg className="filter-illustration" viewBox="0 0 440 330" role="img" aria-label="Illustration of an automotive air filter">
                <defs>
                  <linearGradient id="filterBody" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#e8dfce" />
                    <stop offset=".52" stopColor="#a99b84" />
                    <stop offset="1" stopColor="#665f54" />
                  </linearGradient>
                  <linearGradient id="filterEdge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#262723" />
                    <stop offset="1" stopColor="#0e100f" />
                  </linearGradient>
                  <filter id="filterShadow" x="-30%" y="-30%" width="160%" height="180%">
                    <feGaussianBlur stdDeviation="12" />
                  </filter>
                </defs>
                <ellipse cx="222" cy="270" rx="132" ry="22" fill="#000" opacity=".48" filter="url(#filterShadow)" />
                <g transform="translate(220 152) rotate(-14)">
                  <path d="M-115-60 Q0-103 115-60 L104 58 Q0 100-104 58Z" fill="url(#filterBody)" stroke="#f0e8d9" strokeOpacity=".54" strokeWidth="2" />
                  {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M${-98 + i * 12} -68 L${-88 + i * 11} 71`} stroke="#393a35" strokeOpacity=".58" strokeWidth="3" />)}
                  <path d="M-115-60 Q0-103 115-60 L115-39 Q0 3-115-39Z" fill="url(#filterEdge)" />
                  <path d="M-104 42 Q0 81 104 42 L104 58 Q0 100-104 58Z" fill="#272824" />
                  <path d="M-115-60 Q0-103 115-60" fill="none" stroke="#f4ead6" strokeOpacity=".7" strokeWidth="2" />
                </g>
                <circle cx="342" cy="63" r="3" fill="#d4af70" />
                <circle cx="85" cy="245" r="2" fill="#d4af70" opacity=".6" />
              </svg>
              <span className="feature-art-caption">PART No. 17220-RB6-200</span>
            </div>
            <div className="feature-details">
              <div>
                <span className="feature-kicker">HONDA · FIT</span>
                <h2>Air filter</h2>
              </div>
              <span className="coming-badge"><i /> Coming soon</span>
            </div>
            <div className="feature-footer">
              <span>Listed price</span>
              <strong>K50</strong>
              <a href="/search?q=17220-RB6-200" aria-label="View air filter listing">View listing <span aria-hidden="true">↗</span></a>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Catalogue facts ── */}
      <div className="stats-strip" ref={statsRef}>
        <div className="stats-inner">
          <div className="stat-item">
            <div className="stat-number">{statsVisible ? count288 : 288}</div>
            <div className="stat-label">Catalogue listings · coming soon</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{statsVisible ? count5 : 5}</div>
            <div className="stat-label">Parts categories</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">COD</div>
            <div className="stat-label">Cash on delivery</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">LUSAKA</div>
            <div className="stat-label">Local catalogue</div>
          </div>
        </div>
      </div>

      {/* ── Makes ── */}
      <div className="section">
        <p className="section-eyebrow">
          <span>⚡</span> Browse by make
        </p>
        <h2 className="section-title">SHOP BY BRAND</h2>
        <div className="makes-grid">
          {MAKES.map((m, i) => (
            <MakeCard key={m.name} make={m} index={i} />
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="how-section">
        <div className="section">
          <p className="section-eyebrow">
            <span>📋</span> Simple process
          </p>
          <h2 className="section-title">HOW IT WORKS</h2>
          <div className="how-grid">
            {HOW_IT_WORKS.map((s, i) => (
              <div 
                key={s.n} 
                className="how-item"
                ref={el => { howRefs.current[i] = el }}
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <div className="how-number" aria-hidden="true">{s.n}</div>
                <div className="how-icon">{s.icon}</div>
                <h3 className="how-title">{s.title.toUpperCase()}</h3>
                <p className="how-desc">{s.desc}</p>
                {i < 2 && <span className="how-connector" aria-hidden="true">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="cta-section">
        <div className="cta-glow" aria-hidden="true" />
        <h2 className="cta-title">READY TO FIND<br />YOUR PART?</h2>
        <p className="cta-sub">
          Explore the upcoming catalogue or tell us what part you need. We’ll help you check the listing before you order.
        </p>
        <a href="/search" className="cta-btn">
          Browse All Parts
          <span className="arrow">→</span>
        </a>
      </div>

      {/* ── Trust bar ── */}
      <div className="trust-bar">
        {[
          { icon: '↗', text: 'Browse the catalogue' },
          { icon: '⌕', text: 'Search by vehicle' },
          { icon: '💵', text: 'Cash on delivery' },
          { icon: '✳', text: 'Request a part' },
          { icon: '◉', text: 'Contact on WhatsApp' },
        ].map(t => (
          <div key={t.text} className="trust-item">
            <span className="trust-icon" aria-hidden="true">{t.icon}</span>
            {t.text}
          </div>
        ))}
      </div>

      {/* ── WhatsApp Float ── */}
      <a 
        href="https://wa.me/260772924926" 
        className="whatsapp-float"
        aria-label="Chat on WhatsApp"
        target="_blank"
        rel="noopener noreferrer"
      >
        💬
      </a>
    </div>
  )
}
