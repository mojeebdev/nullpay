import { OnboardStrategy, accountPresets, TongoConfidential, Amount, Address, sepoliaTokens } from 'starkzap'
import { getSDK } from './sdk'

const TONGO_CONTRACT = process.env.NEXT_PUBLIC_TONGO_CONTRACT! as Address

function getToken(symbol: string) {
  const token = sepoliaTokens[symbol as keyof typeof sepoliaTokens]
  if (!token) throw new Error(`Unsupported token: ${symbol}`)
  return token
}

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
  const tokenPreset = getToken(token)
  const tx = await wallet
    .tx()
    .confidentialFund(tongo, {
      amount: Amount.parse(amount, tokenPreset),
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
  const tokenPreset = getToken(token)
  const tx = await wallet
    .tx()
    .confidentialWithdraw(tongo, {
      amount: Amount.parse(amount, tokenPreset),
      to: wallet.address,
      sender: wallet.address,
    })
    .send()

  await tx.wait()
  return tx.hash
}