'use client'
import { usePrivy, WalletWithMetadata } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { onboardWithPrivy } from '@/lib/starkzap'
import type { WalletInterface } from 'starkzap'

export default function Drop() {
  const { user } = usePrivy()
  const [loading, setLoading] = useState(false)
  const [wallet, setWallet] = useState<WalletInterface | null>(null)

  useEffect(() => {
    const handleOnboard = async () => {
      if (!user) return

      setLoading(true)
      try {
        const embeddedWallet = user.linkedAccounts.find(
          (account): account is WalletWithMetadata =>
            account.type === 'wallet' && (account as WalletWithMetadata).walletClientType === 'privy'
        ) as WalletWithMetadata | undefined

        const privyWalletId = embeddedWallet?.address || ''

        if (!privyWalletId || !embeddedWallet) {
          throw new Error('Missing Privy embedded wallet')
        }

        const onboardedWallet = await onboardWithPrivy(
          privyWalletId,
          embeddedWallet.address,
          async (hash: string) => {
            const provider = await (embeddedWallet as any).getEthereumProvider()
            return provider.request({
              method: 'personal_sign',
              params: [hash, embeddedWallet.address],
            })
          }
        )
        setWallet(onboardedWallet)
      } catch (error) {
        console.error('Onboarding failed:', error)
      } finally {
        setLoading(false)
      }
    }

    handleOnboard()
  }, [user])

  return (
    <div>
      {loading && <p>Loading...</p>}
      {wallet && <p>Wallet onboarded: {wallet.address}</p>}
    </div>
  )
}
