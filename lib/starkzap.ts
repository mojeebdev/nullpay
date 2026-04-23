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
        rawSign: async (hash: string) => {
          const sig = await rawSign(hash)
          return sig.length === 132 ? sig.slice(0, 130) : sig
        },
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

async function getSafeResourceBounds(wallet: any, calls: any[]) {
  try {
    
    const estimate = await wallet.account.estimateFee(calls);
    
    
    const buffer = (val: string) => `0x${(BigInt(val) * 115n / 100n).toString(16)}`;

    return {
      resourceBounds: {
        l1_gas: {
          max_amount: buffer(estimate.resourceBounds.l1_gas.max_amount),
          max_price_per_unit: buffer(estimate.resourceBounds.l1_gas.max_price_per_unit),
        },
        l2_gas: {
          max_amount: "0x0",
          max_price_per_unit: "0x0",
        }
      }
    };
  } catch (e) {
    console.error("Estimation failed, falling back to V2:", e);
    return { version: 2 }; 
  }
}

export async function fundDrop(
  wallet: any,
  tongo: TongoConfidential,
  token: string,
  amount: string
): Promise<string> {
  const tokenPreset = getToken(token)
  
  const txBuilder = wallet
    .tx()
    .confidentialFund(tongo, {
      amount: Amount.parse(amount, tokenPreset),
      sender: wallet.address,
    });

  
  const options = await getSafeResourceBounds(wallet, txBuilder.calls);
  
  const tx = await txBuilder.send(options);
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
  
  const txBuilder = wallet
    .tx()
    .confidentialWithdraw(tongo, {
      amount: Amount.parse(amount, tokenPreset),
      to: wallet.address,
      sender: wallet.address,
    });

  const options = await getSafeResourceBounds(wallet, txBuilder.calls);
  
  const tx = await txBuilder.send(options);
  await tx.wait()
  return tx.hash
}
