'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type CartEntry = { quantity?: number }

export default function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
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
          <form className="site-search-form" role="search" onSubmit={event => { event.preventDefault(); router.push(searchTerm.trim() ? `/search?q=${encodeURIComponent(searchTerm.trim())}` : '/search'); setMenuOpen(false) }}>
            <input aria-label="Search vehicle parts" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search by part, vehicle, or OEM number" />
            <button type="submit" aria-label="Search parts"><span aria-hidden="true">⌕</span> Search</button>
          </form>
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
        .site-header { position:sticky;top:0;z-index:100;background:#fff;border-bottom:1px solid #dce2e8;box-shadow:0 2px 8px rgba(16,39,60,.05); }
        .site-header-main { max-width:1280px;min-height:76px;margin:auto;padding:10px 24px;display:flex;align-items:center;gap:20px; }
        .site-brand { color:#17334d;font:700 24px Arial,sans-serif;letter-spacing:-.055em;text-decoration:none;white-space:nowrap; }
        .site-brand span {color:#bd8310}
        .site-tagline {color:#72808d;font-size:10px;letter-spacing:.04em;white-space:nowrap}
        .site-search-form {display:flex;flex:1;max-width:580px;margin-left:auto;border:1px solid #cbd5de;border-radius:5px;overflow:hidden;background:#fff}
        .site-search-form input {min-width:0;flex:1;height:42px;padding:0 13px;border:0;outline:none;color:#18334b;font:14px Arial,sans-serif}
        .site-search-form input::placeholder {color:#8693a0}
        .site-search-form:focus-within {border-color:#39739b;box-shadow:0 0 0 3px rgba(57,115,155,.12)}
        .site-search-form button {display:flex;align-items:center;gap:7px;padding:0 15px;border:0;background:#f4b323;color:#172d42;font-weight:700;cursor:pointer}
        .site-search-form button span {font-size:20px;line-height:1}
        .site-cart-mobile {display:inline-flex;align-items:center;color:#284259;text-decoration:none;font-size:13px}
        .site-nav {min-height:44px;padding:0 max(24px,calc((100% - 1232px)/2));display:flex;align-items:center;justify-content:space-between;background:#17334d}
        .site-nav-links,.site-nav-seller {display:flex;align-items:center;gap:24px}
        .site-nav-links a,.site-seller-login {color:#e1e8ee;text-decoration:none;font-size:12px;white-space:nowrap}
        .site-nav-links a:hover,.site-seller-login:hover,.site-nav-links a.site-nav-active {color:#ffca4d}
        .site-cart-count {display:inline-flex;min-width:19px;height:19px;align-items:center;justify-content:center;margin-left:6px;border-radius:50%;background:#f4b323;color:#172d42;font-size:11px;font-weight:700}
        .site-seller-cta {display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:4px;background:#f4b323;color:#172d42;text-decoration:none;font-size:11px;font-weight:700}
        .site-menu-toggle {display:none}
        @media(max-width:900px) {
          .site-header-main {gap:12px;padding:9px 16px}
          .site-tagline {display:none}
          .site-search-form {max-width:none}
          .site-nav {padding:0 16px}
          .site-nav-links,.site-nav-seller {gap:14px}
        }
        @media(max-width:680px) {
          .site-header-main {min-height:62px;flex-wrap:wrap;gap:9px;padding:9px 14px}
          .site-brand {font-size:21px}
          .site-search-form {order:3;flex-basis:100%;max-width:none}
          .site-search-form input {height:40px;font-size:13px}
          .site-search-form button {padding:0 12px}
          .site-cart-mobile {margin-left:auto}
          .site-menu-toggle {display:flex;width:34px;height:34px;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:1px solid #d5dde4;border-radius:4px;background:#fff}
          .site-menu-toggle span {width:16px;height:2px;background:#19334b}
          .site-nav {display:none;padding:8px 14px 14px}
          .site-nav.site-nav-open {display:flex;align-items:stretch;flex-direction:column;gap:9px}
          .site-nav-links,.site-nav-seller {display:flex;flex-direction:column;align-items:stretch;gap:0}
          .site-nav-links a,.site-seller-login,.site-seller-cta {min-height:40px;display:flex;align-items:center}
          .site-nav-links a {border-bottom:1px solid rgba(255,255,255,.12)}
          .site-seller-cta {justify-content:center;margin-top:6px}
        }
      `}</style>
    </>
  )
}
