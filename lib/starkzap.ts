import { StarkZap, TongoConfidential, OnboardStrategy, Amount } from 'starkzap'
import type { Address } from 'starkzap'

const NETWORK = (process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia') as 'mainnet' | 'sepolia'
const IS_MAINNET = NETWORK === 'mainnet'

const TOKENS = {
  mainnet: {
    USDC: { symbol: 'USDC', decimals: 6,  address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8' },
    STRK: { symbol: 'STRK', decimals: 18, address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d' },
  },
  sepolia: {
    USDC: { symbol: 'USDC', decimals: 6,  address: '0x0512feac6339ff7889822cb5aa2a86c848e9d392bb0e3e237c008674feed8343' },
    STRK: { symbol: 'STRK', decimals: 18, address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d' },
  },
}

export const TONGO_CONTRACTS = {
  USDC: IS_MAINNET
    ? process.env.NEXT_PUBLIC_TONGO_CONTRACT_USDC_MAINNET!
    : process.env.NEXT_PUBLIC_TONGO_CONTRACT_USDC_SEPOLIA!,
  STRK: IS_MAINNET
    ? process.env.NEXT_PUBLIC_TONGO_CONTRACT_STRK_MAINNET!
    : process.env.NEXT_PUBLIC_TONGO_CONTRACT_STRK_SEPOLIA!,
}

let _sdk: StarkZap | null = null
export function getSDK(): StarkZap {
  if (!_sdk) _sdk = new StarkZap({ network: NETWORK })
  return _sdk
}

export async function onboardWithPrivy(embeddedWallet: any) {
  const sdk = getSDK()

  const { wallet } = await sdk.onboard({
    strategy: OnboardStrategy.Privy,
    deploy: 'if_needed',
    privy: {
      resolve: async () => ({
        walletId: embeddedWallet.address,
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

export function getToken(symbol: 'USDC' | 'STRK') {
  return TOKENS[NETWORK][symbol]
}

export function getTongoInstance(
  symbol: 'USDC' | 'STRK',
  tongoPrivateKey: string,
  provider: any
): TongoConfidential {
  return new TongoConfidential({
    privateKey: tongoPrivateKey,
    contractAddress: TONGO_CONTRACTS[symbol] as Address,
    provider,
  })
}

export async function fundDrop(
  wallet: any,
  tongo: TongoConfidential,
  symbol: 'USDC' | 'STRK',
  amountStr: string
): Promise<string> {
  const token = getToken(symbol)
  const amount = Amount.parse(amountStr, token.decimals, token.symbol)
  const calls = await tongo.fund({
    amount,
    sender: wallet.address as Address,
  })
  const tx = await wallet.execute(calls, { feeMode: 'default' })
  await tx.wait()
  return tx.hash
}

export async function claimDrop(
  wallet: any,
  tongo: TongoConfidential,
  symbol: 'USDC' | 'STRK',
  amountStr: string
): Promise<string> {
  const token = getToken(symbol)
  const amount = Amount.parse(amountStr, token.decimals, token.symbol)
  const calls = await tongo.withdraw({
    amount,
    to: wallet.address as Address,
    sender: wallet.address as Address,
  })
  const tx = await wallet.execute(calls, { feeMode: 'default' })
  await tx.wait()
  return tx.hash
}
