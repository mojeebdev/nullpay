'use client'
import { PrivyProvider } from '@privy-io/react-auth'

export default function NullPayPrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#6C63FF',
          landingHeader: 'Enter NullPay',
          loginMessage: 'No seed phrase. No complexity.',
        },
        loginMethods: ['email', 'google'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
          showWalletUIs: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}