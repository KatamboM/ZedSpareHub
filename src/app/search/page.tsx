'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase, type Part } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────
type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest'
type ViewMode = 'grid' | 'list'

interface SearchFilters {
  query: string
  category: string
  make: string
  status: string
  minPrice: number | null
  maxPrice: number | null
  sort: SortOption
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  'All', 'Engine Parts', 'Suspension', 'Brakes', 'Electrical', 
  'Drivetrain / Clutch', 'Body Parts', 'Filters', 'Other'
]

const MAKES = [
  'All', 'Toyota', 'Mitsubishi', 'Nissan', 'Honda', 
  'Isuzu', 'Mazda', 'Ford', 'Hino', 'Multi / Universal'
]

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Status' },
  { value: 'In Stock', label: 'In Stock' },
  { value: 'Low Stock', label: 'Low Stock' },
  { value: 'Unverified', label: 'Coming Soon' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
  { value: 'newest', label: 'Newest First' },
]

// ─── Custom Hooks ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debounced
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
    --surface-glass: rgba(17,17,19,0.9);
    --border: rgba(255,255,255,0.07);
    --border-amber: rgba(240,165,0,0.25);
    --text: #f0ede8;
    --text-dim: rgba(240,237,232,0.7);
    --steel: #6b6b75;
    --steel-light: #a0a0ab;
    --success: #22c55e;
    --warning: #f59e0b;
    --error: #ef4444;
  }

  .search-page {
    background: var(--surface);
    color: var(--text);
    font-family: 'DM Sans', system-ui, sans-serif;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 1; }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-up { animation: fadeUp 0.5s ease-out both; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.3s; }

  /* ── Search Header ── */
  .search-header {
    background: linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%);
    border-bottom: 1px solid var(--border);
    padding: 32px 40px;
    position: sticky;
    top: 0;
    z-index: 40;
    backdrop-filter: blur(20px);
  }
  .search-header-inner {
    max-width: 1280px;
    margin: 0 auto;
  }

  .search-form {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }
  .search-wrap {
    flex: 1;
    position: relative;
  }
  .search-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px 56px 16px 22px;
    font-size: 16px;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    outline: none;
    transition: all 0.2s;
  }
  .search-input::placeholder { color: var(--steel); }
  .search-input:focus {
    border-color: var(--amber);
    background: rgba(240,165,0,0.04);
    box-shadow: 0 0 0 4px rgba(240,165,0,0.08);
  }
  .search-icon {
    position: absolute;
    right: 18px; top: 50%;
    transform: translateY(-50%);
    color: var(--steel);
    pointer-events: none;
  }
  .search-btn {
    padding: 16px 28px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    background: var(--amber);
    color: #000;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .search-btn:hover {
    background: #ffc62b;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(240,165,0,0.3);
  }

  /* ── Search History ── */
  .search-history {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .history-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--steel);
    text-transform: uppercase;
  }
  .history-chip {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 5px 14px;
    font-size: 12px;
    color: var(--steel-light);
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .history-chip:hover {
    border-color: var(--amber);
    color: var(--amber);
    background: rgba(240,165,0,0.08);
  }
  .history-remove {
    opacity: 0.5;
    font-size: 14px;
    line-height: 1;
  }
  .history-chip:hover .history-remove { opacity: 1; }

  /* ── Filters Bar ── */
  .filters-bar {
    max-width: 1280px;
    margin: 0 auto;
    padding: 20px 40px;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: flex-end;
    border-bottom: 1px solid var(--border);
  }
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 160px;
  }
  .filter-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--steel);
    text-transform: uppercase;
  }
  .filter-select {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    outline: none;
    cursor: pointer;
    transition: all 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b6b75' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
  .filter-select:focus {
    border-color: var(--amber);
    box-shadow: 0 0 0 3px rgba(240,165,0,0.08);
  }

  /* ── Price Range ── */
  .price-range {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .price-input {
    width: 100px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    font-family: 'JetBrains Mono', monospace;
    color: var(--text);
    outline: none;
  }
  .price-input:focus { border-color: var(--amber); }
  .price-sep { color: var(--steel); font-size: 13px; }

  /* ── Active Filters ── */
  .active-filters {
    max-width: 1280px;
    margin: 0 auto;
    padding: 16px 40px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    min-height: 52px;
  }
  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(240,165,0,0.1);
    border: 1px solid var(--border-amber);
    border-radius: 100px;
    font-size: 13px;
    color: var(--amber);
    cursor: pointer;
    transition: all 0.2s;
  }
  .filter-chip:hover {
    background: rgba(240,165,0,0.2);
    transform: translateY(-1px);
  }
  .filter-chip-clear {
    background: transparent;
    border-color: var(--border);
    color: var(--steel);
  }
  .filter-chip-clear:hover {
    border-color: var(--error);
    color: var(--error);
    background: rgba(239,68,68,0.1);
  }

  /* ── Results Header ── */
  .results-header {
    max-width: 1280px;
    margin: 0 auto;
    padding: 24px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  .results-count {
    font-size: 14px;
    color: var(--steel);
  }
  .results-count strong {
    color: var(--text);
    font-weight: 600;
  }
  .results-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .sort-select {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    outline: none;
    cursor: pointer;
  }
  .view-toggle {
    display: flex;
    gap: 4px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px;
  }
  .view-btn {
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--steel);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 16px;
  }
  .view-btn.active {
    background: var(--surface-3);
    color: var(--amber);
  }

  /* ── Grid Layouts ── */
  .results-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 40px 80px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .grid-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Cards ── */
  .part-card {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    text-decoration: none;
    display: block;
    transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    position: relative;
    overflow: hidden;
  }
  .part-card::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(240,165,0,0.04) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .part-card:hover {
    border-color: var(--border-amber);
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.3), 0 0 0 1px var(--border-amber);
  }
  .part-card:hover::before { opacity: 1; }

  .part-card-list {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 24px;
    align-items: center;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  .card-category {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--steel);
    background: rgba(255,255,255,0.04);
    padding: 4px 10px;
    border-radius: 6px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 8px;
    color: var(--text);
  }
  .card-part-number {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--amber);
    margin-bottom: 12px;
    letter-spacing: 0.04em;
  }
  .card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .card-meta-item {
    font-size: 12px;
    color: var(--steel);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .card-footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .card-price {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 24px;
    color: var(--amber);
    letter-spacing: 0.02em;
  }
  .card-price-request {
    font-size: 13px;
    color: var(--steel);
    font-style: italic;
  }
  .card-action {
    font-size: 13px;
    color: var(--amber);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: gap 0.2s;
  }
  .part-card:hover .card-action { gap: 8px; }

  /* ── Badges ── */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .badge-green { background: rgba(34,197,94,0.15); color: #4ade80; }
  .badge-amber { background: rgba(245,158,11,0.15); color: #fbbf24; }
  .badge-steel { background: rgba(255,255,255,0.06); color: var(--steel-light); }
  .badge-red { background: rgba(239,68,68,0.15); color: #f87171; }

  /* ── Skeleton ── */
  .skeleton {
    background: linear-gradient(90deg, var(--surface-3) 25%, rgba(255,255,255,0.05) 50%, var(--surface-3) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }

  /* ── Empty State ── */
  .empty-state {
    text-align: center;
    padding: 80px 40px;
    max-width: 500px;
    margin: 0 auto;
  }
  .empty-icon {
    font-size: 56px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  .empty-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 40px;
    margin-bottom: 12px;
    color: var(--text);
  }
  .empty-text {
    color: var(--steel);
    margin-bottom: 24px;
    line-height: 1.6;
  }
  .empty-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-bottom: 24px;
  }
  .empty-chip {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 8px 16px;
    font-size: 13px;
    color: var(--steel-light);
    cursor: pointer;
    transition: all 0.2s;
  }
  .empty-chip:hover {
    border-color: var(--amber);
    color: var(--amber);
    background: rgba(240,165,0,0.08);
  }
  .notify-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: transparent;
    border: 1px solid var(--border-amber);
    border-radius: 10px;
    color: var(--amber);
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
  }
  .notify-btn:hover {
    background: rgba(240,165,0,0.1);
    transform: translateY(-1px);
  }

  /* ── Loading State ── */
  .loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px;
    color: var(--steel);
    font-size: 14px;
  }
  .loading-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--amber);
    animation: pulse 1.4s ease-in-out infinite;
  }
  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }

  /* ── Mobile Filter Drawer ── */
  .filter-drawer-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 50;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .filter-drawer-overlay.open {
    opacity: 1;
    pointer-events: all;
  }
  .filter-drawer {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: 320px;
    background: var(--surface-2);
    border-left: 1px solid var(--border);
    z-index: 51;
    padding: 24px;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
    overflow-y: auto;
  }
  .filter-drawer.open { transform: translateX(0); }
  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .drawer-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 24px;
  }
  .drawer-close {
    background: none;
    border: none;
    color: var(--steel);
    font-size: 24px;
    cursor: pointer;
    padding: 4px;
  }
  .mobile-filter-btn {
    display: none;
    padding: 10px 16px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-size: 14px;
    cursor: pointer;
    align-items: center;
    gap: 8px;
  }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .grid-3 { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .search-header { padding: 20px 24px; }
    .filters-bar { padding: 16px 24px; }
    .results-header { padding: 16px 24px; }
    .results-container { padding: 0 24px 60px; }
    .grid-3 { grid-template-columns: 1fr; }
    .search-form { flex-direction: column; }
    .search-btn { width: 100%; }
    .filter-group { min-width: 140px; }
    .mobile-filter-btn { display: inline-flex; }
    .filters-bar .filter-group:not(.price-group) { display: none; }
  }
  @media (max-width: 480px) {
    .part-card { padding: 20px; }
    .results-controls { width: 100%; }
    .sort-select { flex: 1; }
  }
`

// ─── Status Badge Component ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { class: string; text: string }> = {
    'In Stock':   { class: 'badge-green', text: 'In Stock' },
    'Low Stock':  { class: 'badge-amber', text: 'Low Stock' },
    'Unverified': { class: 'badge-steel', text: 'Coming Soon' },
    'Out of Stock': { class: 'badge-red', text: 'Out of Stock' },
    'Paused':     { class: 'badge-steel', text: 'Unavailable' },
  }
  const c = config[status] || config['Out of Stock']
  return <span className={`badge ${c.class}`}>{c.text}</span>
}

// ─── Part Card Component ─────────────────────────────────────────────────────
function PartCard({ part, viewMode }: { part: Part; viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <a href={`/parts/${part.id}`} className="part-card part-card-list">
        <div>
          <span className="card-category">{part.category}</span>
          <div style={{ marginTop: '8px' }}>
            <StatusBadge status={part.status} />
          </div>
        </div>
        <div>
          <h3 className="card-title" style={{ marginBottom: '4px' }}>{part.part_name}</h3>
          <p className="card-part-number">{part.part_number}</p>
          <div className="card-meta">
            {part.car_make && <span className="card-meta-item">🚗 {part.car_make}</span>}
            {part.car_model && <span className="card-meta-item">· {part.car_model}</span>}
            {part.engine_code && <span className="card-meta-item">⚙️ {part.engine_code}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {part.sell_price_zmw ? (
            <div className="card-price">K{part.sell_price_zmw.toLocaleString()}</div>
          ) : (
            <div className="card-price-request">Price on request</div>
          )}
          <div className="card-action" style={{ marginTop: '8px', justifyContent: 'flex-end' }}>
            View →
          </div>
        </div>
      </a>
    )
  }

  return (
    <a href={`/parts/${part.id}`} className="part-card">
      <div className="card-header">
        <span className="card-category">{part.category}</span>
        <StatusBadge status={part.status} />
      </div>

      <h3 className="card-title">{part.part_name}</h3>
      <p className="card-part-number">{part.part_number}</p>

      <div className="card-meta">
        {part.car_make && <span className="card-meta-item">🚗 {part.car_make}</span>}
        {part.car_model && <span className="card-meta-item">· {part.car_model}</span>}
      </div>

      {part.engine_code && (
        <p style={{ fontSize: '12px', color: 'var(--steel)', marginBottom: '8px' }}>
          Engine: <span style={{ color: 'var(--steel-light)' }}>{part.engine_code}</span>
        </p>
      )}

      <div className="card-footer">
        {part.sell_price_zmw ? (
          <span className="card-price">K{part.sell_price_zmw.toLocaleString()}</span>
        ) : (
          <span className="card-price-request">Price on request</span>
        )}
        <span className="card-action">View →</span>
      </div>
    </a>
  )
}

// ─── Skeleton Card ───────────────────────────────────────────────────────────
function SkeletonCard({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="part-card part-card-list">
        <div>
          <div className="skeleton" style={{ height: '20px', width: '80px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '24px', width: '60px' }} />
        </div>
        <div>
          <div className="skeleton" style={{ height: '18px', width: '70%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '14px', width: '40%', marginBottom: '12px' }} />
          <div className="skeleton" style={{ height: '14px', width: '50%' }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="skeleton" style={{ height: '28px', width: '80px', marginBottom: '8px', marginLeft: 'auto' }} />
          <div className="skeleton" style={{ height: '16px', width: '60px', marginLeft: 'auto' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="part-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div className="skeleton" style={{ height: '20px', width: '80px' }} />
        <div className="skeleton" style={{ height: '24px', width: '60px' }} />
      </div>
      <div className="skeleton" style={{ height: '18px', width: '90%', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '14px', width: '50%', marginBottom: '16px' }} />
      <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '16px' }} />
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: '28px', width: '80px' }} />
        <div className="skeleton" style={{ height: '16px', width: '60px' }} />
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  const suggestions = ['Fuel Pump', 'Brake Pads', 'Oil Filter', 'Toyota', 'Ball Joint']
  
  return (
    <div className="empty-state animate-fade-up">
      <div className="empty-icon">🔍</div>
      <h3 className="empty-title">NO PARTS FOUND</h3>
      <p className="empty-text">
        {query 
          ? `No results for "${query}". Try checking the spelling, using a different part number, or browse our popular categories below.`
          : 'No parts match your current filters. Try adjusting your search criteria.'
        }
      </p>
      <div className="empty-suggestions">
        {suggestions.map(s => (
          <button key={s} className="empty-chip" onClick={() => onClear()}>
            {s}
          </button>
        ))}
      </div>
      <button className="notify-btn" onClick={() => alert('Notification feature coming soon!')}>
        🔔 Notify me when available
      </button>
    </div>
  )
}

// ─── Main Search Content ─────────────────────────────────────────────────────
function SearchContent() {
  const params = useSearchParams()
  const router = useRouter()
  
  // Filter states
  const [query, setQuery] = useState(params.get('q') || '')
  const [category, setCategory] = useState('All')
  const [make, setMake] = useState(params.get('make') || 'All')
  const [status, setStatus] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState<SortOption>('relevance')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  
  // Data states
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  
  // History
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('zsh-search-history', [])
  
  // Debounced query for API calls
  const debouncedQuery = useDebounce(query, 400)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Sync URL params on mount
  useEffect(() => {
    const urlQuery = params.get('q')
    const urlMake = params.get('make')
    if (urlQuery) setQuery(urlQuery)
    if (urlMake) setMake(urlMake)
  }, [params])
  
  // Fetch parts
  useEffect(() => {
    const fetchParts = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      
      setLoading(true)
      
      try {
        let q = supabase
          .from('parts')
          .select('*', { count: 'exact' })
        
        // Text search
        if (debouncedQuery) {
          q = q.or(
            `part_name.ilike.%${debouncedQuery}%,part_number.ilike.%${debouncedQuery}%,car_model.ilike.%${debouncedQuery}%,engine_code.ilike.%${debouncedQuery}%,car_make.ilike.%${debouncedQuery}%`
          )
        }
        
        // Filters
        if (category !== 'All') q = q.eq('category', category)
        if (make !== 'All') q = q.eq('car_make', make)
        if (status !== 'All') q = q.eq('status', status)
        if (minPrice) q = q.gte('sell_price_zmw', parseFloat(minPrice))
        if (maxPrice) q = q.lte('sell_price_zmw', parseFloat(maxPrice))
        
        // Exclude out of stock/paused by default unless specifically filtered
        if (status === 'All') {
          q = q.neq('status', 'Out of Stock').neq('status', 'Paused')
        }
        
        // Sorting
        switch (sort) {
          case 'price-asc': q = q.order('sell_price_zmw', { ascending: true }); break
          case 'price-desc': q = q.order('sell_price_zmw', { ascending: false }); break
          case 'name-asc': q = q.order('part_name', { ascending: true }); break
          case 'name-desc': q = q.order('part_name', { ascending: false }); break
          case 'newest': q = q.order('created_at', { ascending: false }); break
          default: q = q.order('id', { ascending: false })
        }
        
        q = q.limit(60)
        
        const { data, count, error } = await q
        
        if (error) throw error
        
        setParts(data || [])
        setTotal(count || 0)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('Search error:', err)
        setParts([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }
    
    fetchParts()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [debouncedQuery, category, make, status, minPrice, maxPrice, sort])
  
  // Save to history when user submits
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    // Add to history
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.toLowerCase() !== query.toLowerCase())
      return [query.trim(), ...filtered].slice(0, 8)
    })
    
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }
  
  const clearFilters = () => {
    setQuery('')
    setCategory('All')
    setMake('All')
    setStatus('All')
    setMinPrice('')
    setMaxPrice('')
    setSort('relevance')
    router.push('/search')
  }
  
  const removeFromHistory = (item: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSearchHistory(prev => prev.filter(h => h !== item))
  }
  
  const applyHistory = (item: string) => {
    setQuery(item)
    router.push(`/search?q=${encodeURIComponent(item)}`)
  }
  
  // Active filter chips
  const activeFilters: { label: string; onRemove: () => void }[] = []
  if (query) activeFilters.push({ label: `Search: "${query}"`, onRemove: () => setQuery('') })
  if (category !== 'All') activeFilters.push({ label: category, onRemove: () => setCategory('All') })
  if (make !== 'All') activeFilters.push({ label: make, onRemove: () => setMake('All') })
  if (status !== 'All') activeFilters.push({ label: status, onRemove: () => setStatus('All') })
  if (minPrice || maxPrice) {
    activeFilters.push({ 
      label: `K${minPrice || '0'} - K${maxPrice || '∞'}`, 
      onRemove: () => { setMinPrice(''); setMaxPrice('') }
    })
  }
  
  return (
    <div className="search-page">
      <style>{CSS}</style>
      
      {/* ── Search Header ── */}
      <div className="search-header">
        <div className="search-header-inner">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-wrap">
              <input
                className="search-input"
                type="search"
                placeholder="Search by part name, OEM number, model, engine code..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search parts"
              />
              <span className="search-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
            </div>
            <button type="submit" className="search-btn">Search</button>
          </form>
          
          {/* Search History */}
          {searchHistory.length > 0 && !query && (
            <div className="search-history animate-fade-up delay-1">
              <span className="history-label">Recent:</span>
              {searchHistory.map(item => (
                <button 
                  key={item} 
                  className="history-chip"
                  onClick={() => applyHistory(item)}
                >
                  {item}
                  <span 
                    className="history-remove" 
                    onClick={(e) => removeFromHistory(item, e)}
                    role="button"
                    aria-label={`Remove ${item} from history`}
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* ── Filters Bar ── */}
      <div className="filters-bar">
        <div className="filter-group">
          <label className="filter-label">Category</label>
          <select 
            className="filter-select" 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">Make</label>
          <select 
            className="filter-select" 
            value={make} 
            onChange={e => setMake(e.target.value)}
            aria-label="Filter by make"
          >
            {MAKES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select 
            className="filter-select" 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            aria-label="Filter by availability"
          >
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        
        <div className="filter-group price-group">
          <label className="filter-label">Price Range (ZMW)</label>
          <div className="price-range">
            <input
              className="price-input"
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              min="0"
            />
            <span className="price-sep">—</span>
            <input
              className="price-input"
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              min="0"
            />
          </div>
        </div>
        
        <button 
          className="mobile-filter-btn"
          onClick={() => setMobileFiltersOpen(true)}
        >
          ⚙️ Filters
        </button>
      </div>
      
      {/* ── Active Filters ── */}
      {activeFilters.length > 0 && (
        <div className="active-filters animate-fade-up">
          {activeFilters.map((filter, i) => (
            <button key={i} className="filter-chip" onClick={filter.onRemove}>
              {filter.label} <span>×</span>
            </button>
          ))}
          <button className="filter-chip filter-chip-clear" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      )}
      
      {/* ── Results Header ── */}
      <div className="results-header">
        <p className="results-count">
          {loading ? (
            <span>Searching...</span>
          ) : (
            <>
              <strong>{total}</strong> part{total !== 1 ? 's' : ''} found
              {debouncedQuery && <span> for "<strong>{debouncedQuery}</strong>"</span>}
            </>
          )}
        </p>
        
        <div className="results-controls">
          <select 
            className="sort-select" 
            value={sort} 
            onChange={e => setSort(e.target.value as SortOption)}
            aria-label="Sort results"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>
      
      {/* ── Results ── */}
      <div className="results-container">
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid-3' : 'grid-list'}>
            {Array(6).fill(0).map((_, i) => (
              <SkeletonCard key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : parts.length === 0 ? (
          <EmptyState query={debouncedQuery} onClear={clearFilters} />
        ) : (
          <div className={viewMode === 'grid' ? 'grid-3' : 'grid-list'}>
            {parts.map((part, i) => (
              <div 
                key={part.id} 
                className="animate-fade-up" 
                style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}
              >
                <PartCard part={part} viewMode={viewMode} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* ── Mobile Filter Drawer ── */}
      <div 
        className={`filter-drawer-overlay ${mobileFiltersOpen ? 'open' : ''}`}
        onClick={() => setMobileFiltersOpen(false)}
      />
      <div className={`filter-drawer ${mobileFiltersOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3 className="drawer-title">Filters</h3>
          <button className="drawer-close" onClick={() => setMobileFiltersOpen(false)}>×</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select 
              className="filter-select" 
              value={category} 
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Make</label>
            <select 
              className="filter-select" 
              value={make} 
              onChange={e => setMake(e.target.value)}
            >
              {MAKES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select 
              className="filter-select" 
              value={status} 
              onChange={e => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Price Range (ZMW)</label>
            <div className="price-range">
              <input
                className="price-input"
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
              />
              <span className="price-sep">—</span>
              <input
                className="price-input"
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            className="search-btn" 
            style={{ width: '100%', marginTop: '12px' }}
            onClick={() => setMobileFiltersOpen(false)}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Error Boundary Wrapper ──────────────────────────────────────────────────
function SearchErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  
  if (hasError) {
    return (
      <div className="search-page">
        <style>{CSS}</style>
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3 className="empty-title">SOMETHING WENT WRONG</h3>
          <p className="empty-text">Unable to load search. Please refresh the page or try again later.</p>
          <button className="search-btn" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

// ─── Export ──────────────────────────────────────────────────────────────────
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="search-page">
        <style>{CSS}</style>
        <div className="loading-indicator">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
      </div>
    }>
      <SearchErrorBoundary>
        <SearchContent />
      </SearchErrorBoundary>
    </Suspense>
  )
}
