import { StarkZap } from 'starkzap'

let sdk: StarkZap | null = null

export function getSDK(): StarkZap {
  if (!sdk) {
    sdk = new StarkZap({ network: 'sepolia' })
  }
  return sdk
}