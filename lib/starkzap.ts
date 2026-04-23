import {
  OnboardStrategy,
  accountPresets,
  TongoConfidential,
  Amount,
  Address,
  sepoliaTokens,
} from 'starkzap'
import { getSDK } from './sdk'

const TONGO_CONTRACT = process.env.NEXT_PUBLIC_TONGO_CONTRACT! as Address

function getToken(symbol: string) {
  const token = sepoliaTokens[symbol as keyof typeof sepoliaTokens]
  if (!token) throw new Error(`Unsupported token: ${symbol}`)
  return token
}

export async function onboardWithInjected() {
  const sdk = getSDK()

  
  const starknet = (window as any).starknet
  if (!starknet) {
    throw new Error('No Starknet wallet found. Please install ArgentX or Braavos.')
  }

  
  await starknet.enable()

  const account = starknet.account
  if (!account?.address) {
    throw new Error('No account returned. Please unlock your wallet and try again.')
  }

  const { wallet } = await sdk.onboard({
    strategy: OnboardStrategy.Signer,
    accountPreset: accountPresets.argentXV050,
    deploy: 'if_needed',
    account,
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
