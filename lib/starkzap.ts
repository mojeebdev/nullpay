import { OnboardStrategy } from '@starkzap/sdk'
import { getSDK } from './sdk'

export async function onboardWithPrivy(privyWalletId: string, embeddedWallet: any) {
  const sdk = getSDK()

  const { wallet } = await sdk.onboard({
    strategy: OnboardStrategy.Privy,
    deploy: 'if_needed',
    privy: {
      resolve: async () => ({
        walletId: privyWalletId,
        publicKey: embeddedWallet.address,
        rawSign: async (_walletId: string, messageHash: string) => {
          const provider = await embeddedWallet.getEthereumProvider()
          const signature = await provider.request({
            method: 'personal_sign',
            params: [messageHash, embeddedWallet.address],
          })
          return signature
        },
      }),
    },
  })
  return wallet
}
