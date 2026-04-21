'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import Link from 'next/link'
import Logo from '@/components/Logo'

const NAV = [
  { icon: '⊞', label: 'DASHBOARD', active: true,  href: '/dashboard' },
  { icon: '◈', label: 'PAYMENTS',  active: false, href: '/drop' },
  { icon: '◉', label: 'SECURITY',  active: false, href: null },
  { icon: '▣', label: 'VAULT',     active: false, href: null },
]

interface Balance { usdc: string; strk: string; loading: boolean }

const IS_MAINNET = process.env.NEXT_PUBLIC_STARKNET_NETWORK === 'mainnet'

export default function Dashboard() {
  const router = useRouter()
  const { ready, authenticated, user, logout } = usePrivy()
  const { wallets } = useWallets()
  const [balance, setBalance] = useState<Balance>({ usdc: '—', strk: '—', loading: true })
  const [copied, setCopied] = useState(false)

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy')
  const walletAddress = embeddedWallet?.address || null

  useEffect(() => {
    if (ready && !authenticated) router.push('/onboard')
  }, [ready, authenticated, router])

  // Fetch balances via raw JSON-RPC
  useEffect(() => {
    if (!walletAddress) return
    const fetchBalances = async () => {
      setBalance(b => ({ ...b, loading: true }))
      try {
        const network = process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia'

        const RPCS = network === 'mainnet' ? [
          'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
          'https://rpc.starknet.lava.build',
        ] : [
          'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
          'https://rpc.starknet-testnet.lava.build',
          'https://starknet-sepolia.infura.io/v3/public',
        ]

        const USDC = network === 'mainnet'
          ? '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8'
          : '0x0512feac6339ff7889822cb5aa2a86c848e9d392bb0e3e237c008674feed8343'
        const STRK = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'

        // balanceOf selector
        const SELECTOR = '0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e'

        const rpcCall = async (rpc: string, contract: string) => {
          const res = await fetch(rpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 1,
              method: 'starknet_call',
              params: [{
                contract_address: contract,
                entry_point_selector: SELECTOR,
                calldata: [walletAddress],
              }, 'latest'],
            }),
          })
          if (!res.ok) throw new Error('HTTP ' + res.status)
          return res.json()
        }

        const getBalance = async (contract: string, decimals: number): Promise<string> => {
          for (const rpc of RPCS) {
            try {
              const data = await rpcCall(rpc, contract)
              if (data.error) continue
              if (data.result && data.result.length >= 1) {
                const low  = BigInt(data.result[0] || '0x0')
                const high = data.result[1] ? BigInt(data.result[1]) : 0n
                const raw  = low + high * (BigInt(2) ** BigInt(128))
                const val  = Number(raw) / Math.pow(10, decimals)
                return val.toLocaleString(undefined, {
                  minimumFractionDigits: decimals === 6 ? 2 : 4,
                  maximumFractionDigits: decimals === 6 ? 2 : 4,
                })
              }
            } catch { continue }
          }
          return '0.00'
        }

        const [usdc, strk] = await Promise.all([
          getBalance(USDC, 6),
          getBalance(STRK, 18),
        ])
        setBalance({ usdc, strk, loading: false })
      } catch (e) {
        console.error('fetchBalances error:', e)
        setBalance({ usdc: '0.00', strk: '0.00', loading: false })
      }
    }
    fetchBalances()
  }, [walletAddress])

  const copyAddress = async () => {
    if (!walletAddress) return
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 8)}...${addr.slice(-6)}`

  if (!ready || !authenticated) return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A' }}>LOADING...</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column' }}>

      {/* Top nav */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: '#050508', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 32px', borderBottom: '1px solid rgba(44,44,58,0.3)' }}>
        <Logo />
        <nav style={{ display: 'flex', gap: 36 }}>
          {[['STARKNET',false],['ASSETS',true],['LEDGER',false]].map(([l,a]) => (
            <a key={l as string} href="#" style={{ fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: a ? 700 : 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: a ? '#6C63FF' : '#8A8A9A', borderBottom: a ? '2px solid #6C63FF' : 'none', paddingBottom: a ? 3 : 0, textDecoration: 'none' }}>{l as string}</a>
          ))}
        </nav>
        <button
          onClick={logout}
          style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8A9A', background: 'transparent', border: '1px solid #2C2C3A', padding: '10px 18px', borderRadius: 6, cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F0F0F8'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A8A9A'; e.currentTarget.style.borderColor = '#2C2C3A' }}
        >DISCONNECT</button>
      </header>

      <div style={{ display: 'flex', flex: 1, paddingTop: 62 }}>

        {/* Sidebar */}
        <aside style={{ width: 240, flexShrink: 0, background: '#0C0C12', borderRight: '1px solid rgba(44,44,58,0.4)', display: 'flex', flexDirection: 'column', paddingTop: 28, position: 'fixed', left: 0, top: 62, bottom: 0 }}>
          <div style={{ padding: '0 24px', marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#14141C', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#6C63FF', fontSize: 18 }}>◈</span>
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 13, color: '#F0F0F8' }}>
                  {user?.google?.name || user?.email?.address?.split('@')[0] || 'NULL_ID'}
                </div>
                <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A4A5A' }}>
                  {process.env.NEXT_PUBLIC_STARKNET_NETWORK === 'mainnet' ? 'STARKNET_MAINNET' : 'STARKNET_SEPOLIA'}
                </div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1 }}>
            {NAV.map(item => (
              item.href ? (
                <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 24px', background: item.active ? '#14141C' : 'transparent', borderLeft: item.active ? '3px solid #6C63FF' : '3px solid transparent', color: item.active ? '#F0F0F8' : '#4A4A5A', textDecoration: 'none', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item.label}</span>
                </Link>
              ) : (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 24px', borderLeft: '3px solid transparent', color: '#2C2C3A', cursor: 'not-allowed' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 15 }}>{item.icon}</span>
                    <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item.label}</span>
                  </div>
                  <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2C2C3A', border: '1px solid #1E1E28', padding: '2px 6px', borderRadius: 3 }}>SOON</span>
                </div>
              )
            ))}
          </nav>

          <div style={{ padding: 20 }}>
            <Link href="/drop" style={{ display: 'block', width: '100%', background: '#6C63FF', color: '#F0F0F8', padding: '14px', borderRadius: 4, textAlign: 'center', textDecoration: 'none', fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              NEW_PAYMENT
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ marginLeft: 240, flex: 1, padding: '40px 48px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '20%', right: '20%', width: 400, height: 400, background: 'rgba(108,99,255,0.03)', filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div className="materialize" style={{ position: 'relative', zIndex: 10, maxWidth: 900 }}>

            {/* Page title */}
            <div style={{ marginBottom: 40 }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(28px,4vw,40px)', color: '#F0F0F8', letterSpacing: '-0.02em', marginBottom: 8 }}>Dashboard</h1>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A' }}>EMBEDDED_WALLET · BALANCES · ACTIVITY</p>
            </div>

            {/* Wallet card */}
            <div style={{ background: '#0C0C12', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 12, padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'rgba(108,99,255,0.05)', filter: 'blur(60px)', borderRadius: '50%' }} />
              <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A', display: 'block', marginBottom: 8 }}>EMBEDDED WALLET</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <code style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, color: '#F0F0F8', letterSpacing: '0.02em' }}>
                        {walletAddress ? shortAddress(walletAddress) : '—'}
                      </code>
                      {walletAddress && (
                        <button onClick={copyAddress} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#6C63FF' : '#4A4A5A', fontSize: 16, transition: 'color 0.2s' }}>
                          {copied ? '✓' : '⧉'}
                        </button>
                      )}
                    </div>
                    {walletAddress && (
                      <div style={{ marginTop: 6 }}>
                        <a
                          href={`https://${IS_MAINNET ? '' : 'sepolia.'}starkscan.co/contract/${walletAddress}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6C63FF', textDecoration: 'none' }}
                        >
                          VIEW ON STARKSCAN →
                        </a>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C63FF', animation: 'pulse 2s ease-in-out infinite' }} />
                    <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6C63FF' }}>ACTIVE</span>
                  </div>
                </div>

                {/* Balances */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'USDC Balance', value: balance.usdc, symbol: 'USDC', decimals: 2 },
                    { label: 'STRK Balance', value: balance.strk, symbol: 'STRK', decimals: 4 },
                  ].map(b => (
                    <div key={b.symbol} style={{ background: '#14141C', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '20px 20px' }}>
                      <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A4A5A', display: 'block', marginBottom: 10 }}>{b.label}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 32, color: balance.loading ? '#2C2C3A' : '#F0F0F8', letterSpacing: '-0.02em', transition: 'color 0.3s' }}>
                          {balance.loading ? '···' : b.value}
                        </span>
                        <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#4A4A5A' }}>{b.symbol}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Identity card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'AUTH METHOD', value: user?.google ? 'Google OAuth' : 'Email', icon: user?.google ? 'G' : '✉' },
                { label: 'IDENTITY', value: user?.google?.email || user?.email?.address || '—', icon: '◈' },
              ].map(item => (
                <div key={item.label} style={{ background: '#0C0C12', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '20px 20px' }}>
                  <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A4A5A', display: 'block', marginBottom: 10 }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, fontWeight: 700, color: '#6C63FF' }}>{item.icon}</span>
                    <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: '#F0F0F8', fontWeight: 300 }}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Fund wallet CTA — only shows on sepolia */}
            {process.env.NEXT_PUBLIC_STARKNET_NETWORK !== 'mainnet' && (
              <div style={{ background: '#0C0C12', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6C63FF', display: 'block', marginBottom: 4 }}>TESTNET MODE</span>
                  <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 13, color: '#8A8A9A', fontWeight: 300 }}>Need testnet STRK to pay gas? Use the faucet.</span>
                </div>
                <a
                  href="https://starknet-faucet.vercel.app"
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F0F0F8', background: '#6C63FF', padding: '12px 20px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  GET TESTNET STRK →
                </a>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ background: '#0C0C12', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '24px 28px' }}>
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A', display: 'block', marginBottom: 20 }}>QUICK ACTIONS</span>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/drop" style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F0F0F8', background: '#6C63FF', padding: '14px 24px', borderRadius: 6, textDecoration: 'none' }}>
                  CREATE DROP →
                </Link>
                <button
                  onClick={copyAddress}
                  style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8A9A', background: 'transparent', border: '1px solid #2C2C3A', padding: '14px 24px', borderRadius: 6, cursor: 'pointer' }}
                >
                  {copied ? 'COPIED ✓' : 'COPY ADDRESS'}
                </button>
                <button
                  onClick={logout}
                  style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8A9A', background: 'transparent', border: '1px solid #2C2C3A', padding: '14px 24px', borderRadius: 6, cursor: 'pointer' }}
                >
                  DISCONNECT
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      <footer style={{ marginLeft: 240, padding: '20px 48px', display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A4A5A' }}>© 2025 NULLPAY. PRECISION_LEDGER_ENCRYPTED.</span>
      </footer>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}
