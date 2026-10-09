'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type CartEntry = { quantity?: number }

export default function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const refreshCart = () => {
      try {
        const items = JSON.parse(localStorage.getItem('zedsparehub-cart') || '[]') as CartEntry[]
        setCartCount(items.reduce((count, item) => count + (item.quantity || 1), 0))
      } catch {
        setCartCount(0)
      }
    }
    refreshCart()
    window.addEventListener('storage', refreshCart)
    window.addEventListener('zedspare:cart-updated', refreshCart)
    return () => {
      window.removeEventListener('storage', refreshCart)
      window.removeEventListener('zedspare:cart-updated', refreshCart)
    }
  }, [])

  const links = [
    { href: '/search', label: 'Browse Parts' },
    { href: '/stores', label: 'Stores' },
    { href: '/request-part', label: 'Request a Part' },
    { href: '/cart', label: 'Cart', count: cartCount },
    { href: '/seller/account', label: 'Seller Account' },
  ]

  return (
    <>
      <header className="site-header">
        <div className="site-header-main">
          <a href="/" className="site-brand" aria-label="ZedSpareHub home">
            ZED<span>SPARE</span>HUB
          </a>
          <span className="site-tagline">Zambia's Auto Parts Marketplace</span>
          <a href="/search" className="site-search-link">Search parts <span aria-hidden="true">⌕</span></a>
          <a href="/cart" className="site-cart-mobile" aria-label={`Cart, ${cartCount} items`}>
            Cart <span className="site-cart-count">{cartCount}</span>
          </a>
          <button className="site-menu-toggle" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(value => !value)}>
            <span></span><span></span><span></span>
          </button>
        </div>
        <nav className={`site-nav ${menuOpen ? 'site-nav-open' : ''}`} aria-label="Main navigation">
          <div className="site-nav-links">
            {links.map(link => (
              <a key={link.href} href={link.href} className={pathname === link.href ? 'site-nav-active' : ''} onClick={() => setMenuOpen(false)}>
                {link.label}
                {'count' in link && <span className="site-cart-count">{link.count}</span>}
              </a>
            ))}
          </div>
          <div className="site-nav-seller">
            <a href="/seller/account" className="site-seller-login" onClick={() => setMenuOpen(false)}>Seller login</a>
            <a href="/sell" className="site-seller-cta" onClick={() => setMenuOpen(false)}>Become a Seller <span aria-hidden="true">→</span></a>
          </div>
        </nav>
      </header>
      <style jsx global>{`
        .site-header { position: sticky; top: 0; z-index: 100; background: rgba(13,17,23,.97); backdrop-filter: blur(14px); border-bottom: 1px solid var(--border); }
        .site-header-main { max-width: 1200px; min-height: 66px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; gap: 20px; }
        .site-brand { color: var(--white); font: 26px 'Bebas Neue', sans-serif; letter-spacing: .08em; text-decoration: none; white-space: nowrap; }
        .site-brand span { color: var(--amber); }
        .site-tagline { color: var(--steel); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; margin-right: auto; }
        .site-search-link { color: var(--steel-light); text-decoration: none; font-size: 13px; border: 1px solid var(--border); border-radius: 5px; padding: 9px 14px; }
        .site-search-link:hover, .site-nav-links a:hover, .site-seller-login:hover { color: var(--amber); border-color: rgba(240,165,0,.4); }
        .site-search-link span { font-size: 17px; margin-left: 8px; }
        .site-nav { max-width: 1200px; min-height: 48px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,.04); }
        .site-nav-links, .site-nav-seller { display: flex; align-items: center; gap: 26px; }
        .site-nav-links a, .site-seller-login { color: var(--steel-light); text-decoration: none; font-size: 13px; transition: color .15s ease; }
        .site-nav-links a.site-nav-active { color: var(--amber); }
        .site-cart-count { display: inline-flex; min-width: 19px; height: 19px; align-items: center; justify-content: center; margin-left: 6px; border-radius: 50%; color: var(--ink); background: var(--amber); font-size: 11px; font-weight: 700; }
        .site-seller-cta { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 4px; color: var(--ink); background: var(--amber); text-decoration: none; font-size: 12px; font-weight: 700; }
        .site-seller-cta:hover { background: var(--amber-glow); }
        .site-menu-toggle, .site-cart-mobile { display: none; }
        @media (max-width: 760px) {
          .site-header-main { min-height: 60px; gap: 12px; padding: 0 16px; }
          .site-brand { font-size: 23px; }
          .site-tagline, .site-search-link { display: none; }
          .site-cart-mobile { display: inline-flex; margin-left: auto; align-items: center; color: var(--steel-light); text-decoration: none; font-size: 13px; }
          .site-menu-toggle { display: flex; width: 38px; height: 38px; border: 1px solid var(--border); background: transparent; border-radius: 5px; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; }
          .site-menu-toggle span { width: 17px; height: 2px; background: var(--white); border-radius: 2px; }
          .site-nav { display: none; padding: 8px 16px 16px; border-top: 1px solid var(--border); }
          .site-nav.site-nav-open { display: flex; align-items: stretch; flex-direction: column; gap: 14px; }
          .site-nav-links, .site-nav-seller { display: flex; flex-direction: column; align-items: stretch; gap: 0; }
          .site-nav-links a, .site-seller-login, .site-seller-cta { min-height: 42px; display: flex; align-items: center; }
          .site-nav-links a { border-bottom: 1px solid rgba(255,255,255,.05); }
          .site-seller-cta { justify-content: center; margin-top: 6px; }
        }
      `}</style>
    </>
  )
}
