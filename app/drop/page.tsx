'use client'
import Logo from '@/components/Logo'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { generateDropId } from '@/lib/utils'
import { createDrop, encodeClaimUrl } from '@/lib/drops'
import { onboardWithInjected, getTongoInstance, fundDrop } from '@/lib/starkzap'

const NAV = [
  { icon: '⊞', label: 'DASHBOARD', active: false, href: '/dashboard' },
  { icon: '◈', label: 'PAYMENTS',  active: true,  href: '/drop' },
  { icon: '◉', label: 'SECURITY',  active: false, href: null },
  { icon: '▣', label: 'VAULT',     active: false, href: null },
]

export default function Drop() {
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()

  const [amount, setAmount]     = useState('')
  const [token, setToken]       = useState<'USDC'|'STRK'>('USDC')
  const [confidential, setConf] = useState(true)
  const [loading, setLoading]   = useState(false)
  const [status, setStatus]     = useState('')
  const [dropLink, setDropLink] = useState<string|null>(null)
  const [copied, setCopied]     = useState(false)
  const [txHash, setTxHash]     = useState<string|null>(null)

  useEffect(() => {
    if (ready && !authenticated) router.push('/onboard')
  }, [ready, authenticated, router])

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setLoading(true)
    setStatus('Connecting wallet...')

    try {
      if (!(window as any).starknet) {
        throw new Error('No Starknet wallet detected. Please install ArgentX or Braavos.')
      }

      setStatus('Connecting to Starknet...')
      const wallet = await onboardWithInjected()

      setStatus('Generating ZK proof...')
      const tongoPrivateKey = crypto.randomUUID().replace(/-/g, '')
      const provider = (wallet as any).getProvider()
      const tongo = getTongoInstance(token, tongoPrivateKey, provider)
      const recipientId = JSON.stringify(tongo.recipientId)

      setStatus('Funding confidential vault...')
      const hash = await fundDrop(wallet, tongo, token, amount)
      setTxHash(hash)

      const id = generateDropId()
      const drop = createDrop({
        id,
        amount,
        token,
        confidential,
        tongoPrivateKey,
        recipientId,
        senderAddress: (wallet as any).address,
        txHash: hash,
      })

      setDropLink(encodeClaimUrl(drop))
      setStatus('')
    } catch (err: any) {
      console.error('Drop failed:', err)
      setStatus(`Error: ${err.message || 'Transaction failed'}`)
      setTimeout(() => setStatus(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!dropLink) return
    await navigator.clipboard.writeText(dropLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const lbl = {
    fontFamily: "'Lato',sans-serif" as const,
    fontSize: 11,
    fontWeight: 700 as const,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#8A8A9A',
    display: 'block' as const,
    marginBottom: 10,
  }

  if (!ready || !authenticated) return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A' }}>LOADING...</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column' }}>

      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: '#050508', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 32px' }}>
        <Logo />
        <nav style={{ display: 'flex', gap: 36 }}>
          {[['STARKNET',false],['ASSETS',true],['LEDGER',false]].map(([l,a]) => (
            <a key={l as string} href="#" style={{ fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: a ? 700 : 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: a ? '#6C63FF' : '#8A8A9A', borderBottom: a ? '2px solid #6C63FF' : 'none', paddingBottom: a ? 3 : 0, textDecoration: 'none' }}>{l as string}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user?.email?.address && (
            <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.08em', color: '#4A4A5A' }}>
              {user.email.address}
            </span>
          )}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6C63FF', animation: 'pulse 2s ease-in-out infinite' }} />
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, paddingTop: 62 }}>

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
                <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A4A5A' }}>STARKNET_SEPOLIA</div>
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

        <main style={{ marginLeft: 240, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 62px)' }}>
          <div style={{ position: 'absolute', top: '25%', left: '25%', width: 380, height: 380, background: 'rgba(108,99,255,0.04)', filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none' }} />

          {!dropLink ? (
            <div className="materialize" style={{ width: '100%', maxWidth: 520, background: '#0C0C12', border: '1px solid rgba(44,44,58,0.2)', borderRadius: 12, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
              <div style={{ padding: '40px 44px' }}>
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                  <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(28px,4vw,40px)', color: '#F0F0F8', letterSpacing: '-0.01em', marginBottom: 8 }}>Create a drop</h1>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A' }}>ENCRYPTED_LINK_GENERATION_PROTOCOL</p>
                </div>

                <div style={{ background: '#14141C', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14 }}>🦊</span>
                  <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6C63FF' }}>
                    REQUIRES ARGENTX OR BRAAVOS EXTENSION
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <span style={lbl}>TOTAL AMOUNT</span>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number" placeholder="0.00" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        style={{ width: '100%', background: '#14141C', border: 'none', color: '#F0F0F8', fontSize: 48, fontFamily: "'Lato',sans-serif", fontWeight: 300, padding: '18px 64px 18px 16px', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.boxShadow = '0 0 0 1px #6C63FF' }}
                        onBlur={e => { e.target.style.boxShadow = 'none' }}
                      />
                      <span style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', fontFamily: "'Lato',sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A4A5A' }}>VAL</span>
                    </div>
                  </div>

                  <div>
                    <span style={lbl}>SELECT TOKEN</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {(['USDC','STRK'] as const).map(t => (
                        <button key={t} onClick={() => setToken(t)} style={{ background: '#14141C', border: token === t ? '1px solid #6C63FF' : '1px solid rgba(44,44,58,0.4)', color: token === t ? '#F0F0F8' : '#4A4A5A', padding: '14px', borderRadius: 8, cursor: 'pointer', fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                          <span style={{ fontSize: 16, opacity: token === t ? 1 : 0.3 }}>{t === 'USDC' ? '●' : '◆'}</span>{t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div onClick={() => setConf(!confidential)} style={{ background: '#14141C', border: confidential ? '1px solid rgba(108,99,255,0.3)' : '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.3s', boxShadow: confidential ? '0 0 24px -8px rgba(108,99,255,0.4)' : 'none' }}>
                    <div>
                      <div style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: confidential ? '#6C63FF' : '#8A8A9A', marginBottom: 4 }}>
                        {confidential ? 'AMOUNT HIDDEN ON-CHAIN' : 'AMOUNT VISIBLE ON-CHAIN'}
                      </div>
                      <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8A9A' }}>
                        {confidential ? 'ZERO-KNOWLEDGE PROOF ENABLED' : 'Standard transfer'}
                      </div>
                    </div>
                    <div style={{ width: 44, height: 22, borderRadius: 11, background: confidential ? '#6C63FF' : '#2C2C3A', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 3, left: confidential ? 'calc(100% - 19px)' : 3, width: 16, height: 16, borderRadius: '50%', background: '#F0F0F8', transition: 'left 0.2s' }} />
                    </div>
                  </div>

                  {status && (
                    <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: status.startsWith('Error') ? '#ff6b6b' : '#6C63FF', textAlign: 'center', padding: '8px 0' }}>
                      {status}
                    </div>
                  )}

                  <button
                    onClick={handleCreate}
                    disabled={loading || !amount || parseFloat(amount) <= 0}
                    style={{ width: '100%', background: loading ? 'rgba(108,99,255,0.7)' : '#6C63FF', color: '#F0F0F8', padding: '20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Lato',sans-serif", fontWeight: 900, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}
                  >
                    {loading
                      ? <><span style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{status || 'PROCESSING...'}</>
                      : <>GENERATE CLAIM LINK →</>
                    }
                  </button>
                </div>

                <p style={{ marginTop: 20, textAlign: 'center', fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A', lineHeight: 1.9 }}>
                  FUNDS LOCKED IN NON-CUSTODIAL STARKNET VAULT.<br />
                  POWERED BY TONGO ZK · STARKZAP SDK
                </p>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 10 }}>
              <div className="materialize" style={{ background: '#0C0C12', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '48px 52px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -80, right: -80, width: 220, height: 220, background: 'rgba(108,99,255,0.05)', filter: 'blur(80px)', borderRadius: '50%' }} />
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: 60, height: 60, background: '#14141C', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    <span style={{ color: '#6C63FF', fontSize: 26 }}>✓</span>
                  </div>
                  <h1 style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px,4vw,38px)', color: '#F0F0F8', marginBottom: 12, letterSpacing: '-0.01em' }}>
                    Your drop is live.
                  </h1>
                  {txHash && (
                    <a href={`https://sepolia.starkscan.co/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6C63FF', marginBottom: 24, textDecoration: 'none' }}>
                      VIEW ON STARKSCAN →
                    </a>
                  )}
                  <div style={{ background: '#14141C', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '12px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: '#6C63FF' }}>{parseFloat(amount).toFixed(2)} {token}</span>
                    <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: confidential ? '#6C63FF' : '#4A4A5A' }}>{confidential ? 'CONFIDENTIAL' : 'PUBLIC'}</span>
                  </div>
                  <div style={{ width: '100%', background: '#14141C', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '16px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <code style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: '#F0F0F8', wordBreak: 'break-all', textAlign: 'left', lineHeight: 1.5 }}>{dropLink}</code>
                    <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#6C63FF' : '#8A8A9A', flexShrink: 0, fontSize: 18 }}>{copied ? '✓' : '⧉'}</button>
                  </div>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    <button onClick={handleCopy} style={{ width: '100%', background: '#6C63FF', color: '#F0F0F8', padding: '16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      {copied ? 'COPIED ✓' : 'COPY LINK'}
                    </button>
                    <button onClick={() => { setDropLink(null); setAmount(''); setTxHash(null) }} style={{ width: '100%', background: 'transparent', color: '#F0F0F8', padding: '16px', borderRadius: 6, border: '1px solid #2C2C3A', cursor: 'pointer', fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      CREATE ANOTHER
                    </button>
                  </div>
                  <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8A8A9A', lineHeight: 1.9 }}>
                    LINK EXPIRES AFTER CLAIM · AMOUNT INVISIBLE ON-CHAIN
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 32, textAlign: 'center', opacity: 0.1, userSelect: 'none', pointerEvents: 'none' }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 'clamp(36px,7vw,68px)', letterSpacing: '-0.02em', color: '#F0F0F8' }}>NULL_VAULT</span>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer style={{ marginLeft: 240, padding: '24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          {['PRIVACY','STARKNET_NODE','RESOURCES'].map(l => <a key={l} href="#" style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A4A5A', textDecoration: 'none' }}>{l}</a>)}
        </div>
        <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A4A5A' }}>© 2025 NULLPAY. PRECISION_LEDGER_ENCRYPTED.</span>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}