import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZedSpareHub — Find Every Part Fast',
  description: "Zambia's auto parts marketplace. Search by part name, number, car model or engine code. Fast delivery across Lusaka.",
  keywords: 'car parts Zambia, spare parts Lusaka, auto parts, Toyota parts Zambia, ZedSpareHub',
  openGraph: {
    title: 'ZedSpareHub — Find Every Part Fast',
    description: "Zambia's auto parts marketplace.",
    url: 'https://zedsparehub.com',
    siteName: 'ZedSpareHub',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <a href="/" className="nav-logo">ZED<span>SPARE</span>HUB</a>
            <span className="nav-tagline">Zambia's Auto Parts Marketplace</span>
            <a href="/search" className="btn btn-amber" style={{ padding: '8px 18px', fontSize: '13px' }}>
              Browse Parts
            </a>
          </div>
        </nav>
        {children}
        <footer className="footer">
          <div className="footer-inner">
            <div>
              <span className="nav-logo" style={{ fontSize: '18px' }}>ZED<span style={{ color: 'var(--amber)' }}>SPARE</span>HUB</span>
              <p className="text-sm text-steel mt-4">Lusaka, Zambia · zedsparehub.com</p>
            </div>
            <p className="text-sm text-steel">© 2026 ZedSpareHub. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
