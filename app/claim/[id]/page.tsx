'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { getDrop, claimDrop as markClaimed } from '@/lib/drops'
import { onboardWithPrivy, getTongoInstance, claimDrop } from '@/lib/starkzap'

export default function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { ready, authenticated, login, user } = usePrivy()
  const { wallets } = useWallets()

  const [phase, setPhase] = useState<'resolving'|'login'|'ready'|'claiming'|'claimed'|'invalid'>('resolving')
  const [hashText, setHashText] = useState('')
  const [displayAmt, setDisplayAmt] = useState(0)
  const [txHash, setTxHash] = useState<string|null>(null)
  const [error, setError] = useState<string|null>(null)
  const [drop, setDrop] = useState<ReturnType<typeof getDrop>>(undefined)

  const fullHash = `claim:void:${id}`

  // ANIMATION 05 — Hash typewriter on load
  useEffect(() => {
    if (phase !== 'resolving') return
    let i = 0
    const iv = setInterval(() => {
      setHashText(fullHash.slice(0, i))
      i++
      if (i > fullHash.length) {
        clearInterval(iv)
        setTimeout(() => {
          const found = getDrop(id)
          if (!found || found.claimed) {
            setPhase('invalid')
          } else if (!authenticated) {
            setPhase('login')
          } else {
            setDrop(found)
            setPhase('ready')
          }
        }, 500)
      }
    }, 32)
    return () => clearInterval(iv)
  }, [phase, fullHash, id, authenticated])

  // ANIMATION 03 — Amount counter
  useEffect(() => {
    if (phase !== 'ready' || !drop) return
    const target = parseFloat(drop.amount)
    const dur = 1200
    const start = performance.now()
    function step(now: number) {
      const t = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplayAmt(parseFloat((target * ease).toFixed(2)))
      if (t < 1) requestAnimationFrame(step)
      else setDisplayAmt(target)
    }
    requestAnimationFrame(step)
  }, [phase, drop])

  // After login completes, transition to ready
  useEffect(() => {
    if (phase === 'login' && ready && authenticated) {
      const found = getDrop(id)
      if (!found || found.claimed) {
        setPhase('invalid')
      } else {
        setDrop(found)
        setPhase('ready')
      }
    }
  }, [ready, authenticated, phase, id])

  const handleClaim = async () => {
    if (!drop) return
    setPhase('claiming')
    setError(null)

    try {
      // Get Privy embedded wallet
      const embeddedWallet = wallets.find(w => w.walletClientType === 'privy')
      if (!embeddedWallet) throw new Error('No wallet found. Please login again.')
      // Get the internal Privy wallet ID from linkedAccounts
      const linkedWallet = user?.linkedAccounts?.find(
        (a: any) => a.type === 'wallet' && a.address?.toLowerCase() === embeddedWallet.address.toLowerCase()
      ) as any
      const privyWalletId = linkedWallet?.id || linkedWallet?.walletClientId || embeddedWallet.address

      // Onboard recipient wallet via Starkzap + Privy
      const wallet = await onboardWithPrivy(privyWalletId, embeddedWallet.address)

      // Reconstruct the Tongo instance using the stored private key
      const provider = (wallet as any).getProvider()
      const tongo = getTongoInstance(drop.token, drop.tongoPrivateKey, provider)

      // Withdraw confidential balance to recipient wallet
      const hash = await claimDrop(wallet, tongo, drop.token, drop.amount)
      setTxHash(hash)

      // Mark drop as claimed so link dies
      markClaimed(id)
      setPhase('claimed')
    } catch (err: any) {
      console.error('Claim failed:', err)
      setError(err.message || 'Transaction failed. Please try again.')
      setPhase('ready')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column' }}>

      <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px 24px' }}>
        <Link href="/"><Logo /></Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, #14141C 0%, #050508 70%)', opacity: 0.2, pointerEvents: 'none' }} />

        {/* RESOLVING — typewriter */}
        {phase === 'resolving' && (
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, color: '#6C63FF', letterSpacing: '0.04em', marginBottom: 24, minHeight: 22 }}>
              {hashText}<span style={{ animation: 'blink 0.9s step-end infinite', borderRight: '2px solid #6C63FF', paddingRight: 2 }} />
            </p>
            <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A' }}>RESOLVING DROP...</span>
          </div>
        )}

        {/* LOGIN — recipient needs to authenticate first */}
        {phase === 'login' && (
          <div className="materialize" style={{ maxWidth: 400, width: '100%', position: 'relative', zIndex: 10 }}>
            <div style={{ background: '#0C0C12', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '44px 40px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6C63FF', marginBottom: 24, opacity: 0.7 }}>
                RECIPIENT_AUTH_REQUIRED
              </div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: '#F0F0F8', marginBottom: 12, letterSpacing: '-0.02em' }}>
                Claim your drop.
              </h2>
              <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 300, fontSize: 14, color: '#8A8A9A', marginBottom: 32, lineHeight: 1.7 }}>
                Sign in to receive your funds. No wallet needed — we create one for you.
              </p>
              <button onClick={login} style={{ width: '100%', background: '#6C63FF', color: '#F0F0F8', padding: '18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                SIGN IN TO CLAIM →
              </button>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 300, fontStyle: 'italic', color: '#4A4A5A', marginTop: 20 }}>
                No seed phrase. No complexity.
              </p>
            </div>
          </div>
        )}

        {/* READY — amount + pulse rings on CLAIM */}
        {phase === 'ready' && drop && (
          <div className="materialize" style={{ maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6C63FF', marginBottom: 32, opacity: 0.65 }}>
              RECIPIENT_PAYLOAD_READY
            </p>

            {/* ANIMATION 03 — counter */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 'clamp(72px,14vw,104px)', color: '#6C63FF', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {displayAmt.toFixed(2)}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 'clamp(40px,8vw,68px)', color: '#6C63FF', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {drop.token}
              </div>
            </div>

            <div style={{ margin: '28px 0 48px' }}>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A4A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                {drop.confidential ? 'CONFIDENTIAL' : 'PUBLIC'}
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#4A4A5A', display: 'inline-block' }} />
                ONE TIME
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#4A4A5A', display: 'inline-block' }} />
                POWERED BY STARKNET
              </p>
            </div>

            {error && (
              <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff6b6b', marginBottom: 16, padding: '10px 16px', background: 'rgba(255,107,107,0.08)', borderRadius: 6, border: '1px solid rgba(255,107,107,0.2)' }}>
                {error}
              </div>
            )}

            {/* ANIMATION 04 — pulse rings */}
            <div style={{ width: '100%', maxWidth: 400 }}>
              <div className="pulse-wrap" style={{ width: '100%' }}>
                <div className="pulse-ring" style={{ inset: -10, borderRadius: 10 }} />
                <div className="pulse-ring pulse-ring-2" style={{ inset: -10, borderRadius: 10 }} />
                <button
                  onClick={handleClaim}
                  style={{ width: '100%', background: '#6C63FF', color: '#F0F0F8', padding: '20px 32px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', zIndex: 1, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >CLAIM →</button>
              </div>
            </div>

            <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.28 }}>
              <span style={{ fontSize: 12 }}>🔒</span>
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A4A5A' }}>ENCRYPTED_LEDGER_ACCESS_SINGLE_SESSION</span>
            </div>
          </div>
        )}

        {/* CLAIMING */}
        {phase === 'claiming' && (
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <div style={{ width: 48, height: 48, border: '2px solid #2C2C3A', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 0.85s linear infinite', margin: '0 auto 24px' }} />
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A' }}>
              WITHDRAWING FROM VAULT...
            </p>
          </div>
        )}

        {/* CLAIMED */}
        {phase === 'claimed' && drop && (
          <div className="materialize" style={{ maxWidth: 400, width: '100%', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <div style={{ background: '#0C0C12', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '44px 40px' }}>
              <div style={{ width: 52, height: 52, background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 22, color: '#6C63FF' }}>✓</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 34, color: '#F0F0F8', marginBottom: 12, letterSpacing: '-0.02em' }}>Funds received.</h2>
              <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 300, fontSize: 14, color: '#8A8A9A', marginBottom: 20, lineHeight: 1.7 }}>
                {drop.amount} {drop.token} landed in your wallet.<br />This link is now dead.
              </p>
              {txHash && (
                <a href={`https://sepolia.voyage.online/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6C63FF', marginBottom: 28, textDecoration: 'none' }}>
                  VIEW ON STARKSCAN →
                </a>
              )}
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A4A5A', marginBottom: 28 }}>
                CONFIDENTIAL · NO TRACE · SELF-CUSTODIAL
              </p>
              <Link href="/" style={{ display: 'block', padding: '15px', border: '1px solid #2C2C3A', borderRadius: 6, fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A8A9A', textDecoration: 'none' }}>
                BACK TO NULLPAY
              </Link>
            </div>
          </div>
        )}

        {/* INVALID */}
        {phase === 'invalid' && (
          <div style={{ textAlign: 'center', maxWidth: 360, position: 'relative', zIndex: 10 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: '#4A4A5A', marginBottom: 16 }}>Nothing here.</h2>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A4A5A', marginBottom: 32 }}>
              This drop was already claimed or never existed.
            </p>
            <Link href="/" style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A8A9A', textDecoration: 'none', border: '1px solid #2C2C3A', padding: '14px 28px', borderRadius: 6 }}>
              BACK TO VOID
            </Link>
          </div>
        )}
      </main>

      <footer style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A4A5A' }}>© 2025 NULLPAY. PRECISION_LEDGER_ENCRYPTED.</span>
        <div style={{ display: 'flex', gap: 28 }}>
          {['PRIVACY','STARKNET_NODE','RESOURCES'].map(l => <a key={l} href="#" style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A4A5A', textDecoration: 'none' }}>{l}</a>)}
        </div>
      </footer>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
