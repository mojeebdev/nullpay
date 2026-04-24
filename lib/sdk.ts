import { StarkZap } from 'starkzap'

let sdk: StarkZap | null = null

export function getSDK(): StarkZap {
  if (!sdk) {
    const network = process.env.NEXT_PUBLIC_STARKNET_NETWORK === 'mainnet' ? 'mainnet' : 'sepolia'
    sdk = new StarkZap({ network })
  }
  return sdk
}
