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

const PART_CATEGORIES = [
  { label: 'Engine parts', value: 'Engine Parts', icon: '⚙' },
  { label: 'Brakes', value: 'Brakes', icon: '◉' },
  { label: 'Suspension', value: 'Suspension', icon: '⌁' },
  { label: 'Filters', value: 'Filters', icon: '▤' },
  { label: 'Electrical', value: 'Electrical', icon: 'ϟ' },
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
  /* Marketplace storefront: clear, practical and mobile-first */
  .zsh-page {
    --amber:#f4b323; --amber-dim:rgba(244,179,35,.14); --amber-glow:rgba(244,179,35,.25);
    --surface:#f5f6f8; --surface-2:#fff; --surface-3:#eef1f4; --surface-glass:rgba(255,255,255,.97);
    --border:rgba(18,36,57,.12); --border-amber:rgba(244,179,35,.4); --text:#16283c; --text-dim:#536273;
    --steel:#6e7d8c; --steel-light:#526272;
    background:#f5f6f8;color:#16283c;font-family:Arial,Helvetica,sans-serif;
  }
  .zsh-page * { box-sizing:border-box; }
  .ticker-wrap { min-height:40px;padding:8px clamp(16px,5vw,72px);display:flex;justify-content:center;gap:10px;background:#f5b526;border:0;color:#172b40; }
  .ticker-wrap::before,.ticker-wrap::after {display:none}
  .ticker-item {padding:0;color:#172b40;font:600 12px/1.4 Arial,sans-serif;letter-spacing:0;text-transform:none}
  .ticker-dot {width:6px;height:6px;animation:none}
  .announcement-link {color:#172b40;font-weight:700}
  .announcement-link:hover {color:#314a64}
  .hero {position:relative;min-height:0;padding:76px 0 104px;overflow:hidden;background:linear-gradient(112deg,#0d2238 0%,#173a59 58%,#214964 100%);color:white}
  .hero-grid {opacity:.3;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)}
  .hero-glow-1 {top:-160px;left:auto;right:3%;width:54vw;height:560px;background:radial-gradient(ellipse,rgba(245,181,38,.16),transparent 68%);animation:none}
  .hero-content {position:relative;z-index:1;max-width:1200px;padding:0 clamp(20px,6vw,78px);display:block}
  .hero-copy {max-width:820px}
  .eyebrow {padding:0;border:0;background:transparent;margin:0 0 16px;backdrop-filter:none}
  .eyebrow-dot {display:none}
  .eyebrow-text,.section-eyebrow {color:#e4a919;font:700 11px/1.4 Arial,sans-serif;letter-spacing:.12em}
  .hero-headline {max-width:760px;margin:0 0 16px;font:800 clamp(38px,5.3vw,66px)/1.05 Arial,sans-serif;letter-spacing:-.04em}
  .hero-headline .shimmer-word {color:#f6bd37;-webkit-text-fill-color:#f6bd37;background:none;animation:none}
  .hero-sub {max-width:610px;margin:0 0 24px;color:#d5e0eb;font-size:17px;line-height:1.65}
  .hero-assurances {display:flex;gap:22px;flex-wrap:wrap;color:#e0e7ee;font-size:12px}
  .hero-assurances span {display:flex;align-items:center;gap:5px}
  .hero-assurances span::before {content:'✓';color:#fac440;font-weight:800}
  .hero-assurances strong {color:white;font-size:13px}
  .floating-parts {position:absolute;inset:0;max-width:1240px;margin:auto;pointer-events:none;color:rgba(255,255,255,.22)}
  .floating-part {position:absolute;width:68px;height:68px;animation:part-drift 8s ease-in-out infinite}
  .floating-part svg {width:100%;height:100%}
  .floating-wheel {right:10%;top:15%;animation-delay:-1s}
  .floating-gear {right:23%;top:44%;width:46px;height:46px;animation-delay:-4s}
  .floating-disc {right:6%;bottom:20%;width:54px;height:54px;animation-delay:-6s}
  @keyframes part-drift {0%,100%{transform:translate3d(0,0,0) rotate(-5deg)}50%{transform:translate3d(0,-13px,0) rotate(5deg)}}
  .vehicle-search-panel {position:relative;z-index:3;max-width:1060px;margin:-58px auto 0;padding:22px clamp(16px,3vw,32px);border:1px solid #d9dfe6;border-radius:8px;background:white;color:#182b3e;box-shadow:0 16px 42px rgba(14,34,54,.15)}
  .search-panel-heading {display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px}
  .search-tabs {display:flex;gap:8px;margin:0}
  .search-tab {padding:10px 15px;border:1px solid transparent;border-radius:5px;background:transparent;color:#586879;font-size:14px;font-weight:700}
  .search-tab.active {color:#183651;border-color:#d9e0e7;background:#f2f5f8}
  .search-panel-request,.section-link {color:#1d5d88;font-size:13px;font-weight:700;text-decoration:none}
  .market-search-row {display:flex;gap:10px}
  .search-box,.vehicle-fields {position:relative;display:flex;flex:1;gap:10px}
  .search-input-field {width:100%;min-height:54px;padding:0 16px;border:1px solid #cbd4de;border-radius:5px;background:white;color:#172c40;font-size:15px}
  .search-input-field::placeholder {color:#7b8997}
  .search-input-field:focus {outline:0;border-color:#2474a6;box-shadow:0 0 0 3px rgba(36,116,166,.13)}
  .search-icon-wrap {position:absolute;top:18px;right:16px;color:#64798b}
  .search-btn {min-height:54px;padding:0 26px;border:0;border-radius:5px;background:#f5b526;color:#182b3d;font-size:14px;font-weight:800;white-space:nowrap}
  .search-btn:hover {background:#ffc947;box-shadow:0 5px 16px rgba(180,124,10,.18)}
  .search-suggestions {position:absolute;z-index:8;top:calc(100% + 4px);left:0;right:0;border:1px solid #d6dee6;border-radius:5px;background:white;box-shadow:0 12px 24px rgba(14,34,54,.12);color:#182b3e}
  .suggestion-item {padding:11px 14px}
  .suggestion-item:hover {background:#f3f6f8}
  .search-panel-bottom {display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:13px}
  .popular-label {margin-right:3px;color:#526476;font-size:12px;font-weight:700}
  .popular-chip {padding:6px 10px;border:1px solid #dbe1e7;border-radius:4px;background:white;color:#31495e;font-size:12px}
  .popular-chip:hover {transform:translateY(-1px);border-color:#91a9bc;box-shadow:none}
  .search-note {margin-left:auto;color:#7a8793;font-size:11px}
  .section {max-width:1200px;padding:68px clamp(20px,5vw,64px)}
  .category-section {padding-top:58px}
  .section-heading-row {display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:22px}
  .section-title {margin:7px 0 8px;color:#172b40;font:750 clamp(27px,3vw,36px)/1.15 Arial,sans-serif;letter-spacing:-.03em}
  .section-intro {margin:0;color:#657484;font-size:14px}
  .section-link {padding-bottom:6px}
  .category-grid {display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
  .category-card {position:relative;display:flex;min-height:145px;flex-direction:column;justify-content:space-between;padding:18px;border:1px solid #dfe4e9;border-radius:6px;background:white;color:#19324a;text-decoration:none;box-shadow:0 2px 6px rgba(19,39,58,.03);transition:transform .18s,border-color .18s,box-shadow .18s}
  .category-card:hover {transform:translateY(-3px);border-color:#aabccc;box-shadow:0 9px 20px rgba(19,39,58,.08)}
  .category-icon {display:grid;width:46px;height:46px;place-items:center;border-radius:6px;background:#eff4f7;color:#1e628f;font-size:25px}
  .category-title {font-size:15px;font-weight:700}
  .category-arrow {position:absolute;right:17px;bottom:18px;color:#718394}
  .section:not(.category-section) {padding-top:54px;padding-bottom:66px}
  .makes-grid {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
  .make-card {border:1px solid #dfe4e9;border-radius:6px;background:white;color:#1a2d40;padding:18px 20px;box-shadow:0 2px 6px rgba(19,39,58,.03)}
  .make-card:hover {transform:translateY(-2px);border-color:#aabccc;box-shadow:0 8px 18px rgba(19,39,58,.08)}
  .make-icon {width:104px;height:60px;border-radius:4px;background:#f8f9fa;padding:7px}
  .make-name {color:#1b3045;font:700 16px Arial,sans-serif}
  .make-count {color:#647484;font-size:12px}
  .how-section {border:0;border-top:1px solid #e0e5e9;border-bottom:1px solid #e0e5e9;background:#edf1f4;color:#1a2d40}
  .how-item {padding:32px 24px}
  .how-number {color:#dba21f;font:700 42px/1 Arial,sans-serif}
  .how-icon {color:#1e628f}
  .how-title {color:#1a2d40;font:700 18px Arial,sans-serif}
  .how-desc {color:#5c6d7c;font-size:14px;line-height:1.65}
  .cta-section {position:relative;max-width:none;padding:52px 24px;background:#17334d;color:white;text-align:center}
  .cta-title {color:white;font:750 clamp(32px,4vw,48px)/1.08 Arial,sans-serif}
  .cta-sub {max-width:640px;margin:15px auto 22px;color:#d2dce5;line-height:1.6}
  .cta-btn {border-radius:4px;background:#f5b526;color:#182b3d;animation:none;padding:14px 22px;font-size:13px;font-weight:800}
  .trust-bar {display:flex;justify-content:center;gap:clamp(16px,3vw,38px);border:0;border-top:1px solid #dce2e7;background:white;color:#516171;padding:22px}
  .trust-item {color:#526475;font:600 11px Arial,sans-serif}
  .whatsapp-float {border-radius:50%;box-shadow:0 8px 24px rgba(37,211,102,.2)}
  .vehicle-memory {background:#edf3f7;color:#284157}
  @media(max-width:900px) {
    .category-grid {grid-template-columns:repeat(3,minmax(0,1fr))}
    .hero {padding-top:62px}
    .floating-wheel {right:7%;top:12%}
    .floating-gear {right:15%;top:51%}
    .floating-disc {right:5%;bottom:18%}
  }
  @media(max-width:680px) {
    .hero {padding:52px 0 88px}
    .hero-content {padding:0 20px}
    .hero-headline {font-size:clamp(36px,10vw,54px)}
    .hero-sub {font-size:15px}
    .hero-assurances {gap:9px 16px}
    .floating-part {opacity:.55}
    .floating-wheel {width:46px;height:46px;right:7%;top:8%}
    .floating-gear {width:34px;height:34px;right:8%;top:58%}
    .floating-disc {display:none}
    .vehicle-search-panel {margin:-50px 14px 0;padding:16px 14px;border-radius:7px}
    .search-panel-heading {align-items:flex-start;flex-direction:column}
    .search-tabs {width:100%}
    .search-tab {flex:1;padding:9px 8px}
    .market-search-row,.vehicle-fields {flex-direction:column}
    .search-btn {width:100%}
    .search-note {width:100%;margin:2px 0 0}
    .section-heading-row {align-items:flex-start;flex-direction:column}
    .category-grid {grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .category-card {min-height:128px;padding:14px}
    .makes-grid {grid-template-columns:repeat(2,minmax(0,1fr))}
    .section {padding:50px 18px}
    .trust-bar {flex-wrap:wrap}
  }
  @media(prefers-reduced-motion:reduce) {
    .floating-part {animation:none}
    .category-card,.make-card {transition:none}
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
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [statsVisible, setStatsVisible] = useState(false)
  const [suggestionsVisible, setSuggestionsVisible] = useState(false)
  const [vehicleMemory, setVehicleMemory] = useLocalStorage<VehicleMemory>('zsh-vehicle', {})
  
  const statsRef = useRef<HTMLDivElement>(null)
  const howRefs = useRef<(HTMLDivElement | null)[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const count288 = useCountUp(288, 1800, statsVisible)
  const count5 = useCountUp(5, 1200, statsVisible)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStatsVisible(true)
    }, { threshold: 0.3 })
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
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
    const searchTerm = searchMode === 'vehicle'
      ? [vehicleMake.trim(), vehicleModel.trim()].filter(Boolean).join(' ')
      : query.trim()
    if (!searchTerm) return

    setVehicleMemory(prev => ({ ...prev, lastSearch: searchTerm }))
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
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

      {vehicleMemory.lastSearch && (
        <div className="vehicle-memory">
          <span aria-hidden="true">⌕</span>
          <span>Last search: “{vehicleMemory.lastSearch}”</span>
          <button className="vehicle-memory-btn" onClick={clearVehicleMemory} aria-label="Clear previous search">Clear</button>
        </div>
      )}

      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow-1" aria-hidden="true" />
        <div className="floating-parts" aria-hidden="true">
          <div className="floating-part floating-wheel">
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="25" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="2" />
              <circle cx="32" cy="32" r="5" fill="currentColor" />
              <path d="M32 16v11m0 10v11M16 32h11m10 0h11M21 21l8 8m6 6 8 8m0-22-8 8m-6 6-8 8" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="floating-part floating-gear">
            <svg viewBox="0 0 64 64" fill="none">
              <path d="M27 7h10l2 7a20 20 0 0 1 5 2l6-3 7 8-4 6a20 20 0 0 1 1 5l5 5-4 10-7-1a20 20 0 0 1-4 4l-1 7H29l-2-7a20 20 0 0 1-5-2l-6 3-7-8 4-6a20 20 0 0 1-1-5l-5-5 4-10 7 1a20 20 0 0 1 4-4l1-7Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          </div>
          <div className="floating-part floating-disc">
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="3" />
              <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="2" />
              <circle cx="32" cy="32" r="4" fill="currentColor" />
              <circle cx="32" cy="15" r="2" fill="currentColor" />
              <circle cx="47" cy="25" r="2" fill="currentColor" />
              <circle cx="42" cy="43" r="2" fill="currentColor" />
              <circle cx="22" cy="43" r="2" fill="currentColor" />
              <circle cx="17" cy="25" r="2" fill="currentColor" />
            </svg>
          </div>
        </div>
        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">ZEDSPAREHUB · LUSAKA, ZAMBIA</p>
            <h1 className="hero-headline">
              Find parts for<br />
              <span className="shimmer-word">the road ahead.</span>
            </h1>
            <p className="hero-sub">
              Search the Zambian parts catalogue by part name, OEM number, vehicle make, model, or engine.
            </p>
            <div className="hero-assurances" ref={statsRef}>
              <span><strong>{statsVisible ? count288 : 288}</strong> catalogue listings · coming soon</span>
              <span><strong>{statsVisible ? count5 : 5}</strong> categories</span>
              <span>Cash on delivery</span>
            </div>
          </div>
        </div>

        <div ref={searchRef} className="vehicle-search-panel">
          <div className="search-panel-heading">
            <div className="search-tabs" role="tablist" aria-label="Choose how to search">
              <button
                type="button"
                className={`search-tab ${searchMode === 'part' ? 'active' : ''}`}
                onClick={() => setSearchMode('part')}
                role="tab"
                aria-selected={searchMode === 'part'}
              >Search by part</button>
              <button
                type="button"
                className={`search-tab ${searchMode === 'vehicle' ? 'active' : ''}`}
                onClick={() => setSearchMode('vehicle')}
                role="tab"
                aria-selected={searchMode === 'vehicle'}
              >Search by vehicle</button>
            </div>
            <a href="/request-part" className="search-panel-request">Can’t find it? Request a part <span aria-hidden="true">↗</span></a>
          </div>
          <form className="market-search-row" onSubmit={handleSearch}>
            {searchMode === 'part' ? (
              <div className="search-box">
                <input
                  className="search-input-field"
                  placeholder="Part name, OEM number, make, or model"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value)
                    setSuggestionsVisible(true)
                  }}
                  onFocus={() => setSuggestionsVisible(true)}
                  aria-label="Search by part name, number, or vehicle"
                />
                <span className="search-icon-wrap" aria-hidden="true">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
                <SearchSuggestions query={query} onSelect={goSearch} visible={suggestionsVisible} />
              </div>
            ) : (
              <div className="vehicle-fields">
                <input
                  className="search-input-field"
                  placeholder="Make (e.g. Toyota)"
                  value={vehicleMake}
                  onChange={e => setVehicleMake(e.target.value)}
                  aria-label="Vehicle make"
                />
                <input
                  className="search-input-field"
                  placeholder="Model or engine (e.g. Hilux, 2KD)"
                  value={vehicleModel}
                  onChange={e => setVehicleModel(e.target.value)}
                  aria-label="Vehicle model or engine"
                />
              </div>
            )}
            <button type="submit" className="search-btn">Search parts <span aria-hidden="true">→</span></button>
          </form>
          <div className="search-panel-bottom">
            <span className="popular-label">Popular searches</span>
            {POPULAR_PARTS.slice(0, 4).map(p => (
              <button key={p} type="button" className="popular-chip" onClick={() => goSearch(p)}>{p}</button>
            ))}
            <span className="search-note">Listings are coming soon; please confirm before ordering.</span>
          </div>
        </div>
      </section>

      <section className="section category-section" aria-labelledby="shop-by-part">
        <div className="section-heading-row">
          <div>
            <p className="section-eyebrow">BROWSE THE CATALOGUE</p>
            <h2 className="section-title" id="shop-by-part">Shop by part</h2>
            <p className="section-intro">Choose a category to browse parts arriving soon.</p>
          </div>
          <a href="/search" className="section-link">Browse all parts <span aria-hidden="true">→</span></a>
        </div>
        <div className="category-grid">
          {PART_CATEGORIES.map(category => (
            <a key={category.value} href={`/search?category=${encodeURIComponent(category.value)}`} className="category-card">
              <span className="category-icon" aria-hidden="true">{category.icon}</span>
              <span className="category-title">{category.label}</span>
              <span className="category-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

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
