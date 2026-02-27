import type { Metadata } from 'next'
import { Instrument_Serif, Instrument_Sans } from 'next/font/google'
import { CartProvider } from '@/lib/cart'
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
  title: 'Rocket Boogie Co.',
  description: 'Stickers, prints, cards & more — handcrafted in our studio.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${instrumentSerif.variable} ${instrumentSans.variable}`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
