import { OnboardStrategy, accountPresets, TongoConfidential, Amount, Address } from 'starkzap'
import { getSDK } from './sdk'

const TONGO_CONTRACT = process.env.NEXT_PUBLIC_TONGO_CONTRACT! as Address

export async function onboardWithPrivy(
  privyWalletId: string,
  publicKey: string,
  rawSign: (hash: string) => Promise<string>
) {
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

export function getTongoInstance(
  _token: string,
  tongoPrivateKey: string,
  provider: any
): TongoConfidential {
  return new TongoConfidential({
    privateKey: tongoPrivateKey,
    contractAddress: TONGO_CONTRACT,
    provider,
  })
}

export async function fundDrop(
  wallet: any,
  tongo: TongoConfidential,
  token: string,
  amount: string
): Promise<string> {
  const tx = await wallet
    .tx()
    .confidentialFund(tongo, {
      amount: Amount.parse(amount, token),
      sender: wallet.address,
    })
    .send()

  await tx.wait()
  return tx.hash
}

export async function claimDrop(
  wallet: any,
  tongo: TongoConfidential,
  token: string,
  amount: string
): Promise<string> {
  const tx = await wallet
    .tx()
    .confidentialWithdraw(tongo, {
      amount: Amount.parse(amount, token),
      to: wallet.address,
      sender: wallet.address,
    })
    .send()

  await tx.wait()
  return tx.hash
}
