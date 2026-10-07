import { supabase } from '@/lib/supabase'
import styles from './stores.module.css'

type StorePart = { seller: string | null; category: string | null; status: string | null }

export default async function StoresPage() {
  const { data } = await supabase.from('parts').select('seller,category,status').not('seller', 'is', null)
  const stores = new Map<string, { total: number; available: number; categories: Set<string> }>()
  ;((data || []) as StorePart[]).forEach(part => {
    const name = part.seller?.trim()
    if (!name) return
    const current = stores.get(name) || { total: 0, available: 0, categories: new Set<string>() }
    current.total += 1
    if (part.status === 'In Stock' || part.status === 'Low Stock') current.available += 1
    if (part.category) current.categories.add(part.category)
    stores.set(name, current)
  })
  const list = Array.from(stores.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <main className="container" style={{ paddingTop: 44, paddingBottom: 80 }}>
      <p className="mono text-amber text-xs" style={{ letterSpacing: '.12em' }}>LOCAL PARTS SHOPS</p>
      <h1 className="display" style={{ fontSize: 46, marginTop: 8 }}>OUR STORES</h1>
      <p className="text-sm text-steel" style={{ maxWidth: 620, lineHeight: 1.75, marginTop: 10 }}>Browse shops listing parts on ZedSpareHub. Stock is reconfirmed with each seller before an order is dispatched.</p>
      {list.length ? (
        <div className={styles.storesGrid}>
          {list.map(([name, store]) => (
            <article className={`card ${styles.storeCard}`} key={name}>
              <div className={styles.storeMark} aria-hidden="true">{name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="badge badge-green">Listed seller</p>
                <h2 className="display" style={{ fontSize: 26, marginTop: 12 }}>{name}</h2>
                <p className="text-xs text-steel" style={{ marginTop: 6 }}>{store.available ? `${store.available} parts currently marked in stock` : 'Listings are being confirmed with the shop'}</p>
                <p className="text-xs text-steel" style={{ marginTop: 5 }}>{Array.from(store.categories).slice(0, 4).join(' · ') || 'Auto parts'}</p>
              </div>
              <a href={`/search?q=${encodeURIComponent(name)}`} className="btn btn-ghost" style={{ marginTop: 10 }}>View parts →</a>
            </article>
          ))}
        </div>
      ) : (
        <section className="card" style={{ maxWidth: 680, padding: 28, marginTop: 28 }}>
          <h2 className="display" style={{ fontSize: 26 }}>SELLER LISTINGS ARE BEING PREPARED</h2>
          <p className="text-sm text-steel" style={{ marginTop: 8 }}>Check back soon or send us a part request and we’ll look for it with local shops.</p>
          <a href="/search" className="btn btn-amber" style={{ marginTop: 18 }}>Browse Parts</a>
        </section>
      )}
    </main>
  )
}
