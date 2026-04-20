'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase, type Part } from '@/lib/supabase'

const CATEGORIES = ['All','Engine Parts','Suspension','Brakes','Electrical','Drivetrain / Clutch','Other']
const MAKES      = ['All','Toyota','Mitsubishi','Nissan','Honda','Isuzu','Mazda','Ford','Hino','Multi / Universal']

function statusBadge(status: string) {
  if (status === 'In Stock')    return <span className="badge badge-green">{status}</span>
  if (status === 'Low Stock')   return <span className="badge badge-amber">{status}</span>
  if (status === 'Unverified')  return <span className="badge badge-steel">Coming Soon</span>
  return <span className="badge badge-red">{status}</span>
}

function SearchContent() {
  const params    = useSearchParams()
  const router    = useRouter()
  const [query,   setQuery]   = useState(params.get('q') || '')
  const [cat,     setCat]     = useState('All')
  const [make,    setMake]    = useState(params.get('make') || 'All')
  const [parts,   setParts]   = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      let q = supabase.from('parts').select('*', { count: 'exact' })

      if (query) {
        q = q.or(
          `part_name.ilike.%${query}%,part_number.ilike.%${query}%,car_model.ilike.%${query}%,engine_code.ilike.%${query}%,car_make.ilike.%${query}%`
        )
      }
      if (cat  !== 'All') q = q.eq('category', cat)
      if (make !== 'All') q = q.eq('car_make', make)

      q = q.neq('status', 'Out of Stock').neq('status', 'Paused').limit(60)

      const { data, count } = await q
      setParts(data || [])
      setTotal(count || 0)
      setLoading(false)
    }
    fetch()
  }, [query, cat, make])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <main className="container" style={{ padding: '40px 24px 80px' }}>
      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <input
            className="search-input"
            placeholder="Search by part name, number, model, engine code..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <span className="search-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
        </div>
        <button type="submit" className="btn btn-amber">Search</button>
      </form>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ minWidth: '180px' }}>
          <label className="form-label">Category</label>
          <select className="form-select" value={cat} onChange={e => setCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: '160px' }}>
          <label className="form-label">Make</label>
          <select className="form-select" value={make} onChange={e => setMake(e.target.value)}>
            {MAKES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Results header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p className="text-steel text-sm">
          {loading ? 'Searching...' : `${total} part${total !== 1 ? 's' : ''} found`}
          {query && <span> for "<span style={{ color: 'var(--white)' }}>{query}</span>"</span>}
        </p>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="grid-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ padding: '24px' }}>
              <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '12px' }} />
              <div className="skeleton" style={{ height: '20px', width: '90%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '14px', width: '40%' }} />
            </div>
          ))}
        </div>
      ) : parts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 className="display" style={{ fontSize: '32px' }}>NO PARTS FOUND</h3>
          <p className="text-steel mt-8">Try a different search — part number, model, or engine code.</p>
          <a href="/search" className="btn btn-ghost mt-24">Clear Search</a>
        </div>
      ) : (
        <div className="grid-3">
          {parts.map(part => (
            <a
              key={part.id}
              href={`/parts/${part.id}`}
              className="card"
              style={{ padding: '24px', textDecoration: 'none', display: 'block' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="badge badge-steel" style={{ fontSize: '10px' }}>{part.category}</span>
                {statusBadge(part.status)}
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 600, lineHeight: 1.4, marginBottom: '8px', color: 'var(--white)' }}>
                {part.part_name}
              </h3>

              <p className="mono text-xs text-amber" style={{ marginBottom: '12px' }}>
                {part.part_number}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {part.car_make && (
                  <span style={{ fontSize: '12px', color: 'var(--steel)' }}>
                    🚗 {part.car_make}
                  </span>
                )}
                {part.car_model && (
                  <span style={{ fontSize: '12px', color: 'var(--steel)' }}>
                    · {part.car_model}
                  </span>
                )}
              </div>

              {part.engine_code && (
                <p className="text-xs text-steel">
                  Engine: <span style={{ color: 'var(--steel-light)' }}>{part.engine_code}</span>
                </p>
              )}

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {part.sell_price_zmw ? (
                  <span className="display text-amber" style={{ fontSize: '22px' }}>
                    K{part.sell_price_zmw.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-sm text-steel">Price on request</span>
                )}
                <span style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 600 }}>View →</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
