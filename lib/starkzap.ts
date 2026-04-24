import {
  TongoConfidential,
  Amount,
  Address,
  sepoliaTokens,
  mainnetTokens,
} from 'starkzap'
import { getSDK } from './sdk'

const IS_MAINNET = process.env.NEXT_PUBLIC_STARKNET_NETWORK === 'mainnet'

const TONGO_CONTRACTS: Record<string, string> = {
  USDC: IS_MAINNET
    ? process.env.NEXT_PUBLIC_TONGO_CONTRACT_USDC_MAINNET!
    : process.env.NEXT_PUBLIC_TONGO_CONTRACT_USDC_SEPOLIA!,
  STRK: IS_MAINNET
    ? process.env.NEXT_PUBLIC_TONGO_CONTRACT_STRK_MAINNET!
    : process.env.NEXT_PUBLIC_TONGO_CONTRACT_STRK_SEPOLIA!,
}

const STARK_N = BigInt('0x0800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f')

export function generateStarkPrivateKey(): bigint {
  let key: bigint
  do {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    key = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
  } while (key === 0n || key >= STARK_N)
  return key
}

function getToken(symbol: string) {
  const tokens = IS_MAINNET ? mainnetTokens : sepoliaTokens
  const token = tokens[symbol as keyof typeof tokens]
  if (!token) throw new Error(`Unsupported token: ${symbol}`)
  return token
}

export async function onboardWithInjected() {
  const starknet = (window as any).starknet
  if (!starknet) {
    throw new Error('No Starknet wallet found. Please install ArgentX or Braavos.')
  }

  // enable() works on ALL injected wallets — ArgentX, Braavos, etc.
  await starknet.enable()

  const address: string =
    starknet.selectedAddress ||
    starknet.account?.address

  if (!address) throw new Error('No account returned from wallet.')

  // Wrap in starkzap wallet interface
  const sdk = getSDK()
  const wallet = await sdk.connectWallet({
    account: {
      signer: starknet.account,
    },
  })

  await wallet.ensureReady({ deploy: 'if_needed' })

  return wallet
}

export function getTongoInstance(
  token: string,
  tongoPrivateKey: bigint,
  provider: any
): TongoConfidential {
  const contractAddress = TONGO_CONTRACTS[token] as Address
  if (!contractAddress) throw new Error(`No Tongo contract for token: ${token}`)
  return new TongoConfidential({
    privateKey: tongoPrivateKey,
    contractAddress,
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
