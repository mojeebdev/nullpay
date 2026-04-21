import type { Metadata } from 'next'
import './globals.css'
import NullPayPrivyProvider from '@/components/PrivyProvider'
import { Analytics } from '@vercel/analytics/react'
export const metadata: Metadata = {
  title: 'NullPay — Send money. Leave no trace.',
  description: 'Privacy-first P2P payments on Starknet. Drop money anonymously via a one-time claim link. No wallet required to receive. Powered by Starkzap.',
  openGraph: {
    title: 'NullPay',
    description: 'Send money. Leave no trace.',
    url: 'https://nullpay.blindspotlab.xyz',
    siteName: 'NullPay',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NullPay — Send money. Leave no trace.',
    description: 'Privacy-first P2P payments on Starknet. Powered by Starkzap.',
    creator: '@mojeebeth',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Lato:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NullPayPrivyProvider>
          {children}
        </NullPayPrivyProvider>
        <Analytics />
      </body>
    </html>
  )
}
