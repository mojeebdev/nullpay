export interface Drop {
  id: string
  amount: string
  token: 'USDC' | 'STRK'
  confidential: boolean
  tongoPrivateKey: string   // encrypted key recipient needs to claim
  recipientId: string       // tongo recipient public key
  senderAddress: string
  claimed: boolean
  createdAt: number
  expiresAt: number
  txHash?: string
}

const drops = new Map<string, Drop>()

export function createDrop(data: Omit<Drop, 'claimed' | 'createdAt' | 'expiresAt'>): Drop {
  const drop: Drop = {
    ...data,
    claimed: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  }
  drops.set(data.id, drop)
  return drop
}

export function getDrop(id: string): Drop | undefined {
  return drops.get(id)
}

export function claimDrop(id: string): boolean {
  const drop = drops.get(id)
  if (!drop || drop.claimed || Date.now() > drop.expiresAt) return false
  drop.claimed = true
  drops.set(id, drop)
  return true
}

export function isExpired(drop: Drop): boolean {
  return Date.now() > drop.expiresAt
}