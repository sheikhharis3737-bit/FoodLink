import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Food Link | Wholesale Groceries Lahore',
  description: 'Order wholesale groceries from Akbari Mandi, Lahore. Fresh prices, simple ordering and reliable delivery.',
  generator: 'Food Link',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f4c62b', userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body>{children}</body>
    </html>
  )
}
