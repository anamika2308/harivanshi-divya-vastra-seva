import type { Metadata } from 'next'
import { Playfair_Display, Nunito } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700'],
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Harivanshi Poshak Seva | Handmade Radha Krishna Outfits | Bhopal',
  description: 'Handmade Radha Krishna divine outfits from Bhopal. Lehenga set, Pitambar, Jodi set, Janmashtami special. Custom orders available. All India delivery.',
  keywords: 'Radha Krishna poshak, bhagwan dress, handmade poshak, Bhopal, Janmashtami special, thakur ji poshak, murti dress, custom poshak',
  openGraph: {
    title: 'Harivanshi Poshak Seva - Handmade Radha Krishna Outfits',
    description: 'Divine handmade outfits made with devotion. Delivered across India from Bhopal.',
    type: 'website',
    locale: 'en_IN',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#4A1B0C" />
      </head>
      <body className={`${playfair.variable} ${nunito.variable} font-body bg-cream`}>
        {children}
      </body>
    </html>
  )
}
