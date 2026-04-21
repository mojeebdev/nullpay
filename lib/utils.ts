export function generateDropId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const arr = new Uint8Array(16)
  if (typeof window !== 'undefined') crypto.getRandomValues(arr)
  return Array.from(arr).map(b => chars[b % chars.length]).join('')
}

export function formatDropLink(id: string): string {
  const base = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://nullpay.blindspotlab.xyz'
  return `${base}/claim/${id}`
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatAmount(amount: string, token: string): string {
  const num = parseFloat(amount)
  if (isNaN(num)) return `0 ${token}`
  return `${num.toFixed(2)} ${token}`
}
