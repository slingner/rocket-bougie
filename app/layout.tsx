import type { Metadata } from 'next'
import { Instrument_Serif, Instrument_Sans } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { CartProvider } from '@/lib/cart'
import Footer from '@/components/Footer'
import AnnouncementBar from '@/components/AnnouncementBar'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
})

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://rocketboogie.com'),
  title: 'Rocket Boogie Co.',
  description: 'Stickers, prints, cards & more, handcrafted in our studio.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${instrumentSerif.variable} ${instrumentSans.variable}`}>
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <CartProvider>
          <AnnouncementBar />
          <div id="main-content">
            {children}
          </div>
          <Footer />
        </CartProvider>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  )
}
