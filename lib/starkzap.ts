import { OnboardStrategy, accountPresets } from 'starkzap'
import { getSDK } from './sdk'

export async function onboardWithPrivy(privyWalletId: string, publicKey: string, rawSign: (hash: string) => Promise<string>) {
  const sdk = getSDK()

  const { wallet } = await sdk.onboard({
    strategy: OnboardStrategy.Privy,
    accountPreset: accountPresets.argentXV050,
    deploy: 'if_needed',
    privy: {
      resolve: async () => ({
        walletId: privyWalletId,
        publicKey,
        rawSign,
      }),
    },
  })

  return wallet
}
