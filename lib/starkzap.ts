import { 
  OnboardStrategy, 
  accountPresets, 
  TongoConfidential, 
  Amount, 
  Address, 
  sepoliaTokens, 
  StarkZap 
} from 'starkzap'

let sdk: StarkZap | null = null

export function getSDK(): StarkZap {
  if (!sdk) {
    sdk = new StarkZap({ network: 'sepolia' })
  }
  return sdk
}

const TONGO_CONTRACT = process.env.NEXT_PUBLIC_TONGO_CONTRACT! as Address

function getToken(symbol: string) {
  const token = sepoliaTokens[symbol as keyof typeof sepoliaTokens]
  if (!token) throw new Error(`Unsupported token: ${symbol}`)
  return token
}

/**
 * Hard-coded 'Sane Defaults' to bypass the SDK's buggy fee estimation.
 * These values are set to be high enough to pass but low enough to avoid FELT OVERFLOW.
 */
const SAFE_V3_OPTIONS = {
  version: 3,
  resourceBounds: {
    l1_gas: {
      max_amount: "0x186a0",         // 100,000 units
      max_price_per_unit: "0x3b9aca00" // 1 Gwei in Fri
    },
    l2_gas: {
      max_amount: "0x0",
      max_price_per_unit: "0x0"
    }
  },
  tip: "0x0"
};

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
    // We apply our safe options here to prevent the initial deployment crash
    ...SAFE_V3_OPTIONS,
    privy: {
      resolve: async () => ({
        walletId: privyWalletId,
        publicKey,
        rawSign: async (hash: string) => {
          const sig = await rawSign(hash)
          return sig.length === 132 ? sig.slice(0, 130) : sig
        },
      }),
    },
  } as any)

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
    .send(SAFE_V3_OPTIONS as any); // Force safe bounds

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
    .send(SAFE_V3_OPTIONS as any); // Force safe bounds

  await tx.wait()
  return tx.hash
}
