import {
  TongoConfidential,
  Amount,
  Address,
  sepoliaTokens,
  type SignerInterface,
} from 'starkzap'
import type { Signature } from 'starknet'
import { getSDK } from './sdk'

const TONGO_CONTRACT = process.env.NEXT_PUBLIC_TONGO_CONTRACT! as Address

// Stark curve order N
const STARK_N = BigInt('0x0800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f')

function getToken(symbol: string) {
  const token = sepoliaTokens[symbol as keyof typeof sepoliaTokens]
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

// Wraps ArgentX / Braavos injected account as a SignerInterface
// getPubKey returns the account address — the wallet manages its own keys internally
class InjectedSigner implements SignerInterface {
  private address: string

  constructor(private starknet: any, address: string) {
    this.address = address
  }

  async getPubKey(): Promise<string> {
    // Return address directly — ArgentX manages its own keys,
    // we never have access to the raw private key
    return this.address
  }

  async signRaw(hash: string): Promise<Signature> {
    // Use starknet_signTypedData or signMessage via the account
    const result = await this.starknet.request({
      type: 'wallet_signTypedData',
      params: {
        domain: { name: 'NullPay', version: '1', chainId: 'SN_SEPOLIA' },
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

  return wallet
}

export function getTongoInstance(
  _token: string,
  tongoPrivateKey: bigint,
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
