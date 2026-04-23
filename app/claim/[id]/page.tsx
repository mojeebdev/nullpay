'use client'
import { usePrivy, WalletWithMetadata } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { onboardWithPrivy } from '@/lib/starkzap'

export default function ClaimPage() {
  const { user } = usePrivy()
  const [loading, setLoading] = useState(false)
  const [wallet, setWallet] = useState(null)

  useEffect(() => {
    const handleClaim = async () => {
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

        const onboardedWallet = await onboardWithPrivy(privyWalletId, embeddedWallet)
        setWallet(onboardedWallet)
      } catch (error) {
        console.error('Claim onboarding failed:', error)
      } finally {
        setLoading(false)
      }
    }

    handleClaim()
  }, [user])

  return (
    <div>
      {loading && <p>Loading...</p>}
      {wallet && <p>Wallet ready for claim: {wallet}</p>}
    </div>
  )
}