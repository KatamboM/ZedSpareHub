import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import OrderForm from './OrderForm'

export default async function PartPage({ params }: { params: { id: string } }) {
  const { data: part } = await supabase
    .from('parts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!part) notFound()

  const { data: related } = await supabase
    .from('parts')
    .select('*')
    .eq('car_make', part.car_make)
    .eq('category', part.category)
    .neq('id', part.id)
    .limit(4)

  function statusBadge(status: string) {
    if (status === 'In Stock')   return <span className="badge badge-green">{status}</span>
    if (status === 'Low Stock')  return <span className="badge badge-amber">{status}</span>
    if (status === 'Unverified') return <span className="badge badge-steel">Coming Soon</span>
    return <span className="badge badge-red">{status}</span>
  }

  return (
    <main className="container" style={{ padding: '40px 24px 80px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '32px', fontSize: '13px', color: 'var(--steel)' }}>
        <a href="/" style={{ color: 'var(--steel)', textDecoration: 'none' }}>Home</a>
        <span>/</span>
        <a href="/search" style={{ color: 'var(--steel)', textDecoration: 'none' }}>Parts</a>
        <span>/</span>
        <a href={`/search?make=${part.car_make}`} style={{ color: 'var(--steel)', textDecoration: 'none' }}>{part.car_make}</a>
        <span>/</span>
        <span style={{ color: 'var(--white)' }}>{part.part_name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '48px', alignItems: 'start' }}>
        {/* Left — Part info */}
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span className="badge badge-steel">{part.category}</span>
            {statusBadge(part.status)}
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.3, marginBottom: '8px' }}>
            {part.part_name}
          </h1>

          <p className="mono text-amber" style={{ fontSize: '16px', marginBottom: '32px' }}>
            {part.part_number}
          </p>

          {/* Price */}
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            {part.sell_price_zmw ? (
              <>
                <p className="text-xs text-steel mono" style={{ letterSpacing: '0.1em', marginBottom: '4px' }}>PRICE (ZMW)</p>
                <p className="display text-amber" style={{ fontSize: '48px' }}>K{part.sell_price_zmw.toLocaleString()}</p>
                <p className="text-xs text-steel mt-8">+ delivery fee · Cash on delivery</p>
              </>
            ) : (
              <>
                <p className="text-xs text-steel mono" style={{ letterSpacing: '0.1em', marginBottom: '8px' }}>PRICE</p>
                <p style={{ fontSize: '18px', fontWeight: 600 }}>Request a quote</p>
                <p className="text-xs text-steel mt-8">Price confirmed on order. Cash on delivery.</p>
              </>
            )}
          </div>

          {/* Specs table */}
          <h2 className="display" style={{ fontSize: '24px', marginBottom: '16px' }}>PART DETAILS</h2>
          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            {[
              { label: 'SKU ID',       value: part.sku_id },
              { label: 'Part Number',  value: part.part_number },
              { label: 'Category',     value: part.category },
              { label: 'Car Make',     value: part.car_make },
              { label: 'Car Model',    value: part.car_model },
              { label: 'Engine Code',  value: part.engine_code },
              { label: 'Year Range',   value: part.year_range },
              { label: 'Seller',       value: part.seller },
              { label: 'In Stock',     value: part.qty_in_stock > 0 ? `${part.qty_in_stock} units` : 'Limited' },
            ].map((row, i) => (
              <div key={row.label} style={{
                display: 'flex',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                padding: '12px 20px',
                background: i % 2 === 0 ? 'var(--surface-2)' : 'transparent',
              }}>
                <span className="text-sm text-steel" style={{ width: '140px', flexShrink: 0 }}>{row.label}</span>
                <span className="text-sm" style={{ fontWeight: 500 }}>{row.value || '—'}</span>
              </div>
            ))}
          </div>

          {part.notes && (
            <div style={{
              marginTop: '20px',
              background: 'rgba(240,165,0,0.06)',
              border: '1px solid rgba(240,165,0,0.2)',
              borderRadius: '8px',
              padding: '16px 20px',
            }}>
              <p className="text-xs text-amber mono" style={{ marginBottom: '6px', letterSpacing: '0.1em' }}>NOTE</p>
              <p className="text-sm" style={{ color: 'var(--steel-light)' }}>{part.notes}</p>
            </div>
          )}
        </div>

        {/* Right — Order form */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <OrderForm part={part} />
        </div>
      </div>

      {/* Related parts */}
      {related && related.length > 0 && (
        <div style={{ marginTop: '64px' }}>
          <h2 className="display" style={{ fontSize: '32px', marginBottom: '24px' }}>
            MORE {part.car_make?.toUpperCase()} {part.category?.toUpperCase()} PARTS
          </h2>
          <div className="grid-4">
            {related.map(r => (
              <a
                key={r.id}
                href={`/parts/${r.id}`}
                className="card"
                style={{ padding: '20px', textDecoration: 'none', display: 'block' }}
              >
                <p className="text-xs text-steel" style={{ marginBottom: '8px' }}>{r.category}</p>
                <p style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.4 }}>{r.part_name}</p>
                <p className="mono text-xs text-amber" style={{ marginTop: '6px' }}>{r.part_number}</p>
                {r.sell_price_zmw && (
                  <p className="display text-amber" style={{ fontSize: '20px', marginTop: '12px' }}>K{r.sell_price_zmw.toLocaleString()}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
