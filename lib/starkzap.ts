import {
  TongoConfidential,
  Amount,
  Address,
  sepoliaTokens,
  mainnetTokens,
  type SignerInterface,
} from 'starkzap'
import type { Signature } from 'starknet'
import { getSDK } from './sdk'

const IS_MAINNET = process.env.NEXT_PUBLIC_STARKNET_NETWORK === 'mainnet'

const TONGO_CONTRACTS: Record<string, string> = IS_MAINNET
  ? {
      USDC:   process.env.NEXT_PUBLIC_TONGO_CONTRACT_USDC_MAINNET!,
      USDC_E: process.env.NEXT_PUBLIC_TONGO_CONTRACT_USDC_MAINNET!,
      STRK:   process.env.NEXT_PUBLIC_TONGO_CONTRACT_STRK_MAINNET!,
    }
  : {
      USDC:   process.env.NEXT_PUBLIC_TONGO_CONTRACT_USDC_SEPOLIA!,
      USDC_E: process.env.NEXT_PUBLIC_TONGO_CONTRACT_USDC_SEPOLIA!,
      STRK:   process.env.NEXT_PUBLIC_TONGO_CONTRACT_STRK_SEPOLIA!,
    }

const tokens = IS_MAINNET ? mainnetTokens : sepoliaTokens

// On Sepolia, native USDC maps to USDC_E for Tongo compatibility
const TOKEN_MAP: Record<string, string> = IS_MAINNET
  ? { USDC: 'USDC', STRK: 'STRK' }
  : { USDC: 'USDC_E', STRK: 'STRK' }

// Stark curve order N
const STARK_N = BigInt('0x0800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f')

function getToken(symbol: string) {
  const mappedSymbol = TOKEN_MAP[symbol] || symbol
  const token = tokens[mappedSymbol as keyof typeof tokens]
  if (!token) throw new Error(`Unsupported token: ${symbol}`)
  return token
}

export function generateStarkPrivateKey(): bigint {
  let key: bigint
  do {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    key = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
  } while (key === 0n || key >= STARK_N)
  return key
}

class InjectedSigner implements SignerInterface {
  private address: string

  constructor(private starknet: any, address: string) {
    this.address = address
  }

  async getPubKey(): Promise<string> {
    return this.address
  }

  async signRaw(hash: string): Promise<Signature> {
    const result = await this.starknet.request({
      type: 'wallet_signTypedData',
      params: {
        domain: { name: 'NullPay', version: '1', chainId: IS_MAINNET ? 'SN_MAIN' : 'SN_SEPOLIA' },
        types: {
          StarkNetDomain: [
            { name: 'name', type: 'felt' },
            { name: 'version', type: 'felt' },
            { name: 'chainId', type: 'felt' },
          ],
          Message: [{ name: 'hash', type: 'felt' }],
        },
        primaryType: 'Message',
        message: { hash },
      },
    })

    if (Array.isArray(result)) return result as Signature
    if (result?.r && result?.s) return [result.r, result.s] as unknown as Signature
    return result as Signature
  }
}

export async function onboardWithInjected() {
  const sdk = getSDK()
  const starknet = (window as any).starknet

  if (!starknet) {
    throw new Error('No Starknet wallet found. Please install ArgentX or Braavos.')
  }

  const accounts = await starknet.enable()
  const address: string =
    (Array.isArray(accounts) && accounts[0])
      ? accounts[0]
      : starknet.selectedAddress || starknet.account?.address

  if (!address) throw new Error('No account returned from wallet.')

  const wallet = await sdk.connectWallet({
    account: {
      signer: new InjectedSigner(starknet, address),
    },
  })

  // Deploy account if needed before any transactions
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
