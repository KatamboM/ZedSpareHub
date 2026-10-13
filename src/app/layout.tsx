import type { Metadata } from 'next'
import './globals.css'
import SiteHeader from './components/SiteHeader'

export const metadata: Metadata = {
  title: 'ZedSpareHub | Auto Parts Catalogue Zambia',
  description: "Search the Zambian auto parts catalogue by part name, part number, make, model, or engine. Catalogue listings are being verified and coming soon.",
  keywords: 'car parts Zambia, spare parts Lusaka, auto parts, Toyota parts Zambia, ZedSpareHub',
  openGraph: {
    title: 'ZedSpareHub | Auto Parts Catalogue Zambia',
    description: "Search parts by name, number, vehicle make, model, or engine. Catalogue listings are being verified and coming soon.",
    url: 'https://zedsparehub.com',
    siteName: 'ZedSpareHub',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
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
