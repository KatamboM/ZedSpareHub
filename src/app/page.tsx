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
  /* ZedSpareHub dark identity */
  .zsh-page {
    --amber:#f18a2e;--amber-dim:rgba(241,138,46,.12);--amber-glow:rgba(241,138,46,.25);
    --surface:#0c121b;--surface-2:#121b26;--surface-3:#1a2634;--surface-glass:rgba(17,26,37,.97);
    --border:rgba(213,224,236,.1);--border-amber:rgba(241,138,46,.32);--text:#edf1f5;--text-dim:#abb7c4;
    --steel:#8794a2;--steel-light:#b3bec9;--success:#58b785;--warning:#e7a84b;
    background:#0a1018;color:#edf1f5;font-family:'DM Sans',system-ui,sans-serif;
  }
  .zsh-page .hero {position:relative;min-height:0;padding:clamp(56px,7vw,86px) 0 46px;overflow:hidden;background:radial-gradient(ellipse at 72% 24%,rgba(35,68,101,.35),transparent 36%),linear-gradient(115deg,#101a26 0%,#0a1018 68%,#111924 100%);color:#f1f4f6}
  .zsh-page .hero-grid {opacity:.48;background-image:linear-gradient(rgba(239,244,248,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(239,244,248,.025) 1px,transparent 1px);mask-image:radial-gradient(ellipse 70% 80% at 65% 45%,black 20%,transparent 100%)}
  .zsh-page .hero-glow-1 {top:-95px;left:auto;right:4%;width:52vw;height:490px;background:radial-gradient(ellipse,rgba(241,138,46,.13),transparent 68%);animation:none}
  .zsh-page .hero-content {position:relative;z-index:1;max-width:1260px;padding:0 clamp(22px,5vw,68px);display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);align-items:center;gap:clamp(34px,6vw,76px)}
  .zsh-page .hero-copy {min-width:0}
  .zsh-page .eyebrow {margin:0 0 20px;padding:0;border:0;background:none;color:#f1a34d;font:700 10px/1.4 'DM Sans',sans-serif;letter-spacing:.16em}
  .zsh-page .eyebrow span {padding:0 5px;color:#707e8e}
  .zsh-page .hero-headline {max-width:690px;margin:0 0 20px;color:#f0f3f6;font:600 clamp(48px,6.3vw,78px)/.99 'DM Sans',sans-serif;letter-spacing:-.058em;text-wrap:balance}
  .zsh-page .hero-headline .shimmer-word {color:#f18a2e;-webkit-text-fill-color:#f18a2e;background:none;animation:none;font-weight:500}
  .zsh-page .hero-sub {max-width:530px;margin:0 0 27px;color:#aebac6;font-size:15px;line-height:1.75}
  .zsh-page .hero-assurances {display:flex;gap:12px 20px;flex-wrap:wrap;color:#aab6c2;font-size:11px}
  .zsh-page .hero-assurances span {display:inline-flex;align-items:center;gap:6px}
  .zsh-page .hero-assurances span::before {content:'•';color:#f18a2e}
  .zsh-page .hero-assurances strong {color:#eff2f5;font-weight:600}
  .zsh-page .brand-spotlight {position:relative;max-width:390px;width:100%;justify-self:end;padding:18px;border:1px solid rgba(237,242,247,.1);border-radius:7px;background:linear-gradient(145deg,rgba(19,31,45,.96),rgba(13,21,31,.98));box-shadow:0 24px 70px rgba(0,0,0,.28)}
  .zsh-page .brand-sheet-crop {width:100%;aspect-ratio:768/359;border-radius:4px;background-image:url('/brand/zedsparehub-lockup.png');background-size:200% auto;background-position:left bottom;background-repeat:no-repeat;background-color:#203754}
  .zsh-page .brand-spotlight-copy {padding:17px 3px 5px}
  .zsh-page .spotlight-kicker {color:#f0a04b;font:600 9px/1.4 'DM Sans',sans-serif;letter-spacing:.12em}
  .zsh-page .brand-spotlight-copy h2 {margin:8px 0;color:#edf1f5;font-size:19px;font-weight:600;line-height:1.3;letter-spacing:-.03em}
  .zsh-page .brand-spotlight-copy p {margin:0;color:#98a7b5;font-size:12px;line-height:1.65}
  .zsh-page .brand-spotlight-copy a {display:inline-flex;gap:8px;margin-top:13px;color:#f3a14d;font-size:11px;font-weight:600;text-decoration:none}
  .zsh-page .brand-spotlight-copy a:hover {color:#ffc176}
  .zsh-page .brand-coordinate {position:absolute;right:18px;top:18px;padding:5px 7px;border:1px solid rgba(255,255,255,.18);border-radius:3px;background:rgba(8,14,22,.75);color:#e2e8ed;font:9px 'JetBrains Mono',monospace;letter-spacing:.04em}
  .zsh-page .floating-parts {color:rgba(241,138,46,.15);pointer-events:none}
  .zsh-page .floating-part {opacity:.7}
  .zsh-page .floating-wheel {right:7%;top:10%}.zsh-page .floating-gear {right:33%;top:17%}.zsh-page .floating-disc {right:4%;bottom:9%}
  .zsh-page .vehicle-search-panel {position:relative;z-index:3;max-width:1124px;margin:36px auto 0;padding:22px clamp(17px,3vw,30px);border:1px solid rgba(213,224,236,.12);border-top:2px solid #e8832e;border-radius:6px;background:linear-gradient(130deg,#121c28,#0f1721);color:#e9edf1;box-shadow:0 17px 44px rgba(0,0,0,.22)}
  .zsh-page .search-panel-heading {display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px}
  .zsh-page .search-tabs {display:flex;gap:6px;margin:0}
  .zsh-page .search-tab {padding:9px 13px;border:1px solid transparent;border-radius:4px;background:transparent;color:#94a2af;font-size:12px;font-weight:600;cursor:pointer}
  .zsh-page .search-tab.active {border-color:rgba(241,138,46,.28);background:rgba(241,138,46,.1);color:#f5a355}
  .zsh-page .search-panel-request {color:#a5b3c0;font-size:11px;text-decoration:none}.zsh-page .search-panel-request:hover {color:#f1a04c}
  .zsh-page .market-search-row {display:flex;gap:9px}
  .zsh-page .search-box,.zsh-page .vehicle-fields {position:relative;display:flex;flex:1;gap:9px}
  .zsh-page .search-input-field {width:100%;min-height:50px;padding:0 16px;border:1px solid #344352;border-radius:4px;background:#0b121a;color:#ecf0f4;font-size:14px}
  .zsh-page .search-input-field::placeholder {color:#778695}
  .zsh-page .search-input-field:focus {outline:0;border-color:#df8738;box-shadow:0 0 0 3px rgba(223,135,56,.12)}
  .zsh-page .search-icon-wrap {position:absolute;top:16px;right:15px;color:#aab5bf}
  .zsh-page .search-btn {min-height:50px;padding:0 21px;border:0;border-radius:4px;background:#f18a2e;color:#20160e;font-size:12px;font-weight:700;white-space:nowrap;cursor:pointer}
  .zsh-page .search-btn:hover {background:#ff9e42;box-shadow:0 6px 19px rgba(241,138,46,.16)}
  .zsh-page .search-suggestions {position:absolute;z-index:8;top:calc(100% + 4px);left:0;right:0;border:1px solid #334456;border-radius:4px;background:#111a25;color:#e7edf2;box-shadow:0 14px 28px rgba(0,0,0,.35)}
  .zsh-page .suggestion-item {padding:11px 13px}.zsh-page .suggestion-item:hover {background:#1a2837}
  .zsh-page .search-panel-bottom {display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:13px}
  .zsh-page .popular-label {margin-right:3px;color:#8f9eac;font-size:10px;font-weight:600}
  .zsh-page .popular-chip {padding:5px 9px;border:1px solid #344353;border-radius:3px;background:#151f2b;color:#c0c9d2;font-size:10px;cursor:pointer}
  .zsh-page .popular-chip:hover {border-color:#d78132;color:#f2a153}
  .zsh-page .search-note {margin-left:auto;color:#7e8c99;font-size:10px}
  .zsh-page .garage-strip {max-width:1124px;margin:14px auto 0;padding:12px 16px;display:flex;align-items:center;gap:12px;border:1px solid rgba(241,138,46,.2);border-radius:5px;background:#111a25;color:#dce4eb}
  .zsh-page .garage-mark {display:grid;width:34px;height:34px;place-items:center;border-radius:4px;background:rgba(241,138,46,.11);color:#f3a04a;font-size:22px}
  .zsh-page .garage-copy {display:flex;min-width:0;flex-direction:column;gap:2px}
  .zsh-page .garage-copy span {color:#f1a14e;font:600 8px 'DM Sans',sans-serif;letter-spacing:.12em}
  .zsh-page .garage-copy strong {overflow:hidden;color:#eff2f5;font-size:12px;text-overflow:ellipsis;white-space:nowrap}
  .zsh-page .garage-copy small {color:#81909d;font-size:9px}
  .zsh-page .garage-search {margin-left:auto;border:0;background:transparent;color:#f4a355;font-size:11px;font-weight:600;cursor:pointer}
  .zsh-page .garage-clear {border:0;background:transparent;color:#83909c;font-size:10px;cursor:pointer}
  .zsh-page .section {max-width:1260px;padding:62px clamp(22px,5vw,68px)}
  .zsh-page .section-heading-row {display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:21px}
  .zsh-page .section-eyebrow {color:#ef9b49;font:600 9px/1.4 'DM Sans',sans-serif;letter-spacing:.13em}
  .zsh-page .section-title {margin:8px 0;color:#e8edf1;font:500 clamp(28px,3vw,38px)/1.15 'DM Sans',sans-serif;letter-spacing:-.04em}
  .zsh-page .section-intro {margin:0;color:#96a4b1;font-size:12px;line-height:1.6}
  .zsh-page .section-link {color:#f0a151;font-size:11px;font-weight:600;text-decoration:none}.zsh-page .section-link:hover {color:#ffc176}
  .zsh-page .category-grid {display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
  .zsh-page .category-card {position:relative;display:flex;min-height:126px;flex-direction:column;justify-content:space-between;padding:15px;border:1px solid rgba(215,227,239,.1);border-radius:5px;background:linear-gradient(145deg,#131e2a,#101720);color:#e6ebef;text-decoration:none;transition:transform .18s,border-color .18s,background .18s}
  .zsh-page .category-card:hover {transform:translateY(-2px);border-color:rgba(241,138,46,.4);background:#172332}
  .zsh-page .category-icon {display:grid;width:39px;height:39px;place-items:center;border-radius:5px;background:rgba(241,138,46,.11);color:#f1a04b;font-size:22px}
  .zsh-page .category-title {font-size:12px;font-weight:600}.zsh-page .category-arrow {position:absolute;right:14px;bottom:14px;color:#758596;font-size:12px}
  .zsh-page .makes-grid {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
  .zsh-page .make-card {border:1px solid rgba(215,227,239,.1);border-radius:5px;background:#121b26;color:#e4eaf0;padding:17px 18px}
  .zsh-page .make-card:hover {transform:translateY(-2px);border-color:rgba(241,138,46,.38);box-shadow:0 12px 26px rgba(0,0,0,.18)}
  .zsh-page .make-icon {width:100px;height:56px;border:1px solid #e7e9eb;border-radius:3px;background:#fff;padding:6px}
  .zsh-page .make-name {color:#e9edf1;font:600 15px 'DM Sans',sans-serif}.zsh-page .make-count {color:#8795a2;font-size:10px}
  .zsh-page .how-section {border-top:1px solid rgba(220,230,240,.08);border-bottom:1px solid rgba(220,230,240,.08);background:#0f1721;color:#edf1f5}
  .zsh-page .how-item {padding:34px 24px}.zsh-page .how-number {color:rgba(241,138,46,.8);font:400 46px/1 'DM Sans',sans-serif}
  .zsh-page .how-icon {color:#f1a04b}.zsh-page .how-title {color:#edf1f5;font:600 17px 'DM Sans',sans-serif}
  .zsh-page .how-desc {color:#98a6b3;font-size:12px;line-height:1.7}
  .zsh-page .cta-section {max-width:none;padding:50px 24px;background:linear-gradient(110deg,#141e2a,#0e151e);text-align:center}
  .zsh-page .cta-title {color:#f0f3f6;font:500 clamp(32px,4vw,48px)/1.08 'DM Sans',sans-serif;letter-spacing:-.04em}
  .zsh-page .cta-sub {max-width:620px;margin:13px auto 21px;color:#a0aeba;font-size:13px;line-height:1.7}
  .zsh-page .cta-btn {border-radius:4px;background:#f18a2e;color:#1b140e;animation:none;padding:13px 20px;font-size:11px;font-weight:700}
  .zsh-page .trust-bar {display:flex;justify-content:center;gap:clamp(16px,3vw,34px);border:0;border-top:1px solid rgba(220,230,240,.08);background:#0b1119;color:#92a0ae;padding:19px 22px}
  .zsh-page .trust-item {color:#95a2ae;font:500 9px 'DM Sans',sans-serif;letter-spacing:.03em}
  .zsh-page .whatsapp-float {border:1px solid rgba(255,255,255,.15);border-radius:50%;box-shadow:0 8px 24px rgba(37,211,102,.18)}
  @media(max-width:900px) {
    .zsh-page .hero-content {grid-template-columns:minmax(0,1fr) minmax(240px,.8fr);gap:26px;padding:0 24px}
    .zsh-page .category-grid {grid-template-columns:repeat(3,minmax(0,1fr))}
  }
  @media(max-width:680px) {
    .zsh-page .hero {padding:42px 0 32px}
    .zsh-page .hero-content {grid-template-columns:1fr;padding:0 19px;gap:26px}
    .zsh-page .hero-headline {font-size:clamp(43px,12vw,61px)}
    .zsh-page .hero-sub {font-size:13px}.zsh-page .hero-assurances {gap:8px 14px}
    .zsh-page .floating-part {opacity:.35}
    .zsh-page .floating-wheel {width:42px;height:42px;right:6%;top:2%}.zsh-page .floating-gear {width:34px;height:34px;right:12%;top:26%}
    .zsh-page .floating-disc {display:none}
    .zsh-page .brand-spotlight {max-width:460px;justify-self:stretch;padding:13px}
    .zsh-page .brand-spotlight-copy {padding:12px 2px 3px}.zsh-page .brand-spotlight-copy h2 {font-size:17px}
    .zsh-page .vehicle-search-panel {margin:22px 13px 0;padding:15px 13px}
    .zsh-page .search-panel-heading {align-items:flex-start;flex-direction:column}
    .zsh-page .search-tabs {width:100%}.zsh-page .search-tab {flex:1;padding:9px 7px}
    .zsh-page .market-search-row,.zsh-page .vehicle-fields {flex-direction:column}
    .zsh-page .search-btn {width:100%}.zsh-page .search-note {width:100%;margin:3px 0 0}
    .zsh-page .garage-strip {margin:10px 13px 0;padding:10px;gap:8px}
    .zsh-page .garage-copy small {display:none}.zsh-page .garage-search {font-size:10px}.zsh-page .garage-clear {font-size:9px}
    .zsh-page .section-heading-row {align-items:flex-start;flex-direction:column}
    .zsh-page .category-grid {grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .zsh-page .category-card {min-height:112px;padding:12px}
    .zsh-page .makes-grid {grid-template-columns:repeat(2,minmax(0,1fr))}
    .zsh-page .section {padding:46px 19px}.zsh-page .trust-bar {flex-wrap:wrap}
  }
  @media(prefers-reduced-motion:reduce) {
    .zsh-page .floating-part {animation:none}
    .zsh-page .category-card,.zsh-page .make-card {transition:none}
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

    if (searchMode === 'vehicle') {
      const make = vehicleMake.trim()
      const model = vehicleModel.trim()
      if (!make && !model) return

      const knownMake = MAKES.find(item => item.name.toLowerCase() === make.toLowerCase())?.name
      const searchTerm = [make, model].filter(Boolean).join(' ')
      setVehicleMemory(prev => ({ ...prev, make, model, lastSearch: searchTerm }))

      const params = new URLSearchParams()
      if (knownMake) params.set('make', knownMake)
      params.set('q', model || make)
      router.push(`/search?${params.toString()}`)
      return
    }

    const searchTerm = query.trim()
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
  const searchSavedVehicle = () => {
    const make = vehicleMemory.make || ''
    const model = vehicleMemory.model || ''
    if (!make && !model) return
    setVehicleMake(make)
    setVehicleModel(model)
    setSearchMode('vehicle')
    const knownMake = MAKES.find(item => item.name.toLowerCase() === make.toLowerCase())?.name
    const params = new URLSearchParams()
    if (knownMake) params.set('make', knownMake)
    params.set('q', model || make)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="zsh-page">
      <style>{CSS}</style>

      {(vehicleMemory.make || vehicleMemory.lastSearch) && (
        <div className="garage-strip">
          <span className="garage-mark" aria-hidden="true">⌖</span>
          <div className="garage-copy">
            <span>{vehicleMemory.make && vehicleMemory.model ? 'YOUR GARAGE' : 'RECENT SEARCH'}</span>
            <strong>{vehicleMemory.make && vehicleMemory.model ? `${vehicleMemory.make} ${vehicleMemory.model}` : vehicleMemory.lastSearch}</strong>
            <small>Saved on this device</small>
          </div>
          {vehicleMemory.make && vehicleMemory.model && <button className="garage-search" onClick={searchSavedVehicle}>Search this vehicle <span aria-hidden="true">→</span></button>}
          <button className="garage-clear" onClick={clearVehicleMemory} aria-label="Clear saved vehicle or recent search">Clear</button>
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
            <p className="eyebrow">BUILT FOR ZAMBIAN DRIVERS <span aria-hidden="true">·</span> LUSAKA</p>
            <h1 className="hero-headline">
              Find it. Check it.<br />
              <span className="shimmer-word">Get moving.</span>
            </h1>
            <p className="hero-sub">
              Search by part name, OEM number, or vehicle. Save your vehicle and come back to your search anytime.
            </p>
            <div className="hero-assurances" ref={statsRef}>
              <span><strong>{statsVisible ? count288 : 288}</strong> catalogue listings · coming soon</span>
              <span><strong>{statsVisible ? count5 : 5}</strong> categories</span>
              <span>Cash on delivery</span>
            </div>
          </div>
          <aside className="brand-spotlight" aria-label="ZedSpareHub parts search">
            <div className="brand-sheet-crop" role="img" aria-label="ZedSpareHub original logo, in orange and white on navy" />
            <div className="brand-spotlight-copy">
              <span className="spotlight-kicker">LOCAL PARTS. ONE STARTING POINT.</span>
              <h2>Know the vehicle.<br />Narrow down the part.</h2>
              <p>Make, model, engine code or part number — start with the detail you know.</p>
              <a href="/request-part">Need a hand finding it? <span aria-hidden="true">↗</span></a>
            </div>
            <span className="brand-coordinate" aria-hidden="true">ZSH / 260</span>
          </aside>
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
                  placeholder="Part name, OEM number, or part code"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value)
                    setSuggestionsVisible(true)
                  }}
                  onFocus={() => setSuggestionsVisible(true)}
                  aria-label="Search by part name, number, or code"
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
            <span className="search-note">Availability is being confirmed. Check before ordering.</span>
          </div>
        </div>
      </section>

      <section className="section category-section" aria-labelledby="shop-by-part">
        <div className="section-heading-row">
          <div>
            <p className="section-eyebrow">START WITH WHAT YOU KNOW</p>
            <h2 className="section-title" id="shop-by-part">Find it by category</h2>
            <p className="section-intro">Explore the catalogue. Listings will open as availability is confirmed.</p>
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
          <span>⌖</span> Search made familiar
        </p>
        <h2 className="section-title">Popular vehicle makes</h2>
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
            <span>↗</span> From search to confirmation
          </p>
          <h2 className="section-title">A clearer way to start</h2>
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
        <h2 className="cta-title">Looking for a part<br />that isn’t listed?</h2>
        <p className="cta-sub">
          Share your vehicle details and the part you need. We’ll use that information to check availability with you.
        </p>
        <a href="/request-part" className="cta-btn">
          Request a Part
          <span className="arrow">→</span>
        </a>
      </div>

      {/* ── Trust bar ── */}
      <div className="trust-bar">
        {[
          { icon: '⌖', text: 'Made for Zambian drivers' },
          { icon: '⚙', text: 'Search by vehicle or part' },
          { icon: '✓', text: 'Confirm availability first' },
          { icon: '↗', text: 'Request a part' },
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
