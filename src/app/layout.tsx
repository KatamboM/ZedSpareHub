import type { Metadata } from 'next'
import './globals.css'
import SiteHeader from './components/SiteHeader'

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
