export interface Drop {
  id: string
  amount: string
  token: 'USDC' | 'STRK'
  confidential: boolean
  tongoPrivateKey: string
  recipientId: string
  senderAddress: string
  claimed: boolean
  createdAt: number
  expiresAt: number
  txHash?: string
}

const STORAGE_KEY = 'nullpay_drops'

function readAll(): Record<string, Drop> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeAll(drops: Record<string, Drop>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drops))
}

export function createDrop(
  data: Omit<Drop, 'claimed' | 'createdAt' | 'expiresAt'>
): Drop {
  const drop: Drop = {
    ...data,
    claimed: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, 
  }
  const all = readAll()
  all[drop.id] = drop
  writeAll(all)
  return drop
}

export function getDrop(id: string): Drop | undefined {
  return readAll()[id]
}

export function claimDrop(id: string): boolean {
  const all = readAll()
  const drop = all[id]
  if (!drop || drop.claimed || Date.now() > drop.expiresAt) return false
  drop.claimed = true
  all[id] = drop
  writeAll(all)
  return true
}

export function isExpired(drop: Drop): boolean {
  return Date.now() > drop.expiresAt
}

export interface ClaimPayload {
  id: string
  amount: string
  token: 'USDC' | 'STRK'
  confidential: boolean
  tongoPrivateKey: string
  recipientId: string
  txHash?: string
}

export function encodeClaimUrl(drop: Drop): string {
  const payload: ClaimPayload = {
    id:              drop.id,
    amount:          drop.amount,
    token:           drop.token,
    confidential:    drop.confidential,
    tongoPrivateKey: drop.tongoPrivateKey,
    recipientId:     drop.recipientId,
    txHash:          drop.txHash,
  }
  const encoded = btoa(JSON.stringify(payload))
  const base = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://nullpay.blindspotlab.xyz'
  return `${base}/claim/${encoded}`
}

export function decodeClaimUrl(encoded: string): ClaimPayload | null {
  try {
    return JSON.parse(atob(encoded)) as ClaimPayload
  } catch {
    return null
  }
}