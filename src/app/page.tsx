'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────
interface VehicleMemory {
  vin?: string
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
  { name: 'Toyota', count: 180, flag: '🇯🇵', color: '#EB0A1E' },
  { name: 'Mitsubishi', count: 40, flag: '🇯🇵', color: '#E60012' },
  { name: 'Nissan', count: 35, flag: '🇯🇵', color: '#C3002F' },
  { name: 'Honda', count: 10, flag: '🇯🇵', color: '#CC0000' },
  { name: 'Mazda', count: 8, flag: '🇯🇵', color: '#101010' },
  { name: 'Subaru', count: 5, flag: '🇯🇵', color: '#0033A0' },
  { name: 'Isuzu', count: 12, flag: '🇯🇵', color: '#333333' },
  { name: 'Suzuki', count: 8, flag: '🇯🇵', color: '#E20A17' },
]

const TICKER_ITEMS = [
  'GENUINE PARTS ONLY', 'LUSAKA DELIVERY', 'TRUSTED SELLERS',
  '288+ PARTS IN STOCK', 'TOYOTA · NISSAN · HONDA · MITSUBISHI',
  'PARTS AT YOUR CONVENIENCE', 'SAME-DAY DISPATCH', 'VIN LOOKUP ENABLED',
  'CASH ON DELIVERY', 'WHATSAPP SUPPORT 24/7',
]

const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { text: 'Brake pads for Toyota Hilux 2019', category: 'Popular', icon: '🔧' },
  { text: 'Oil filter 90915-YZZD2', category: 'OEM Number', icon: '#' },
  { text: 'Fuel pump 1NZ-FE engine', category: 'Engine Code', icon: '⚙️' },
  { text: 'Control arm Nissan X-Trail T32', category: 'Model Specific', icon: '🚗' },
]

const HOW_IT_WORKS = [
  { 
    n: '01', 
    title: 'Search',  
    desc: 'Find your part by name, OEM number, car model, or engine code. Our VIN decoder instantly validates compatibility.',
    icon: '🔍'
  },
  { 
    n: '02', 
    title: 'Verify',   
    desc: 'AI-powered fitment check confirms the part matches your exact vehicle trim and submodel. No guesswork.',
    icon: '✓'
  },
  { 
    n: '03', 
    title: 'Deliver', 
    desc: 'Pay cash on delivery across Lusaka. Real-time tracking from seller to your door. No upfront payment needed.',
    icon: '🚚'
  },
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

  .vin-input {
    font-family: 'JetBrains Mono', monospace !important;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

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
    font-size: 36px;
    margin-bottom: 16px;
    filter: grayscale(0.2);
    transition: transform 0.3s;
    display: inline-block;
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
      <div className="make-icon">{make.flag} 🚗</div>
      <div className="make-name">{make.name.toUpperCase()}</div>
      <div className="make-count">{make.count}+ parts available</div>
    </a>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HomePage() {
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'part' | 'vin'>('part')
  const [statsVisible, setStatsVisible] = useState(false)
  const [suggestionsVisible, setSuggestionsVisible] = useState(false)
  const [vehicleMemory, setVehicleMemory] = useLocalStorage<VehicleMemory>('zsh-vehicle', {})
  
  const statsRef = useRef<HTMLDivElement>(null)
  const howRefs = useRef<(HTMLDivElement | null)[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const count288 = useCountUp(288, 1800, statsVisible)
  const count24  = useCountUp(24,  1400, statsVisible)
  const count27  = useCountUp(27,  1500, statsVisible)
  const count8   = useCountUp(8,   1200, statsVisible)

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
    
    if (searchMode === 'vin') {
      // Save VIN to memory
      setVehicleMemory(prev => ({ ...prev, vin: query.trim().toUpperCase() }))
      router.push(`/search?vin=${encodeURIComponent(query.trim().toUpperCase())}`)
    } else {
      setVehicleMemory(prev => ({ ...prev, lastSearch: query.trim() }))
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
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

      {/* ── Ticker ── */}
      <div className="ticker-wrap" aria-label="Announcements">
        <div className="ticker-inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-dot" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Vehicle Memory Banner ── */}
      {(vehicleMemory.vin || vehicleMemory.lastSearch) && (
        <div className="vehicle-memory animate-fade-up">
          <span>🚗</span>
          <span>
            {vehicleMemory.vin 
              ? `Last VIN: ${vehicleMemory.vin}` 
              : `Last search: "${vehicleMemory.lastSearch}"`}
          </span>
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
        <div className="hero-glow-2" aria-hidden="true" />
        <div className="hero-scan-line" aria-hidden="true" />

        <div className="hero-content">
          {/* Eyebrow */}
          <div className="eyebrow animate-fade-up delay-1">
            <span className="eyebrow-dot" aria-hidden="true" />
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
            Search by part name, OEM number, VIN, car model, or engine code.
            Genuine parts from verified Lusaka sellers — delivered to your door with COD.
          </p>

          {/* Search */}
          <div ref={searchRef} className="search-container animate-fade-up delay-4">
            <div className="search-tabs" role="tablist">
              <button 
                className={`search-tab ${searchMode === 'part' ? 'active' : ''}`}
                onClick={() => setSearchMode('part')}
                role="tab"
                aria-selected={searchMode === 'part'}
              >
                🔍 Part Search
              </button>
              <button 
                className={`search-tab ${searchMode === 'vin' ? 'active' : ''}`}
                onClick={() => setSearchMode('vin')}
                role="tab"
                aria-selected={searchMode === 'vin'}
              >
                # VIN Lookup
              </button>
            </div>

            <form className="search-row" onSubmit={handleSearch}>
              <div className="search-box">
                <input
                  className={`search-input-field ${searchMode === 'vin' ? 'vin-input' : ''}`}
                  placeholder={
                    searchMode === 'vin' 
                      ? 'Enter 17-character VIN...' 
                      : 'e.g. Fuel pump, 23221-74021, Vitz 1NZ...'
                  }
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value)
                    setSuggestionsVisible(true)
                  }}
                  onFocus={() => setSuggestionsVisible(true)}
                  maxLength={searchMode === 'vin' ? 17 : undefined}
                  autoFocus
                  aria-label={searchMode === 'vin' ? 'Vehicle Identification Number' : 'Search parts'}
                />
                <span className="search-icon-wrap">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
                
                <SearchSuggestions 
                  query={query} 
                  onSelect={goSearch}
                  visible={suggestionsVisible && searchMode === 'part'} 
                />
              </div>
              <button type="submit" className="search-btn">
                {searchMode === 'vin' ? 'Decode VIN →' : 'Search →'}
              </button>
            </form>

            <div className="popular-row">
              <span className="popular-label">Popular:</span>
              {POPULAR_PARTS.slice(0, 6).map(p => (
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
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-strip" ref={statsRef}>
        <div className="stats-inner">
          <div className="stat-item">
            <div className="stat-number" aria-live="polite">
              {statsVisible ? count288 : 0}+
            </div>
            <div className="stat-label">Parts in Stock</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" aria-live="polite">
              {statsVisible ? count24 : 0}
            </div>
            <div className="stat-label">Categories</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">COD</div>
            <div className="stat-label">Cash on Delivery</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" aria-live="polite">
              {statsVisible ? count27 : 0}
            </div>
            <div className="stat-label">Verified Sellers</div>
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
          288+ genuine parts in stock. AI fitment verification. 
          Stock updated weekly across Lusaka.
        </p>
        <a href="/search" className="cta-btn">
          Browse All Parts
          <span className="arrow">→</span>
        </a>
      </div>

      {/* ── Trust bar ── */}
      <div className="trust-bar">
        {[
          { icon: '✅', text: 'Verified Sellers Only' },
          { icon: '🚚', text: 'Lusaka Wide Delivery' },
          { icon: '💵', text: 'Cash on Delivery' },
          { icon: '🛡', text: 'Fitment Guarantee' },
          { icon: '📞', text: 'WhatsApp Support' },
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
