'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { usePrivy } from '@privy-io/react-auth'
import { decodeClaimUrl, type ClaimPayload } from '@/lib/drops'
import { onboardWithInjected, getTongoInstance, claimDrop } from '@/lib/starkzap'
import type { WalletInterface } from 'starkzap'

export default function ClaimPage({ params }: { params: Promise<{ encoded: string }> }) {
  const { encoded } = use(params)
  const { ready, authenticated, login } = usePrivy()

  const [phase, setPhase] = useState<'resolving'|'login'|'ready'|'claiming'|'claimed'|'invalid'>('resolving')
  const [hashText, setHashText] = useState('')
  const [displayAmt, setDisplayAmt] = useState(0)
  const [txHash, setTxHash] = useState<string|null>(null)
  const [error, setError] = useState<string|null>(null)
  const [payload, setPayload] = useState<ClaimPayload | null>(null)
  const [wallet, setWallet] = useState<WalletInterface | null>(null)

  const fullHash = `claim:void:${encoded.slice(0, 16)}`

 
  useEffect(() => {
    if (phase !== 'resolving') return
    let i = 0
    const iv = setInterval(() => {
      setHashText(fullHash.slice(0, i))
      i++
      if (i > fullHash.length) {
        clearInterval(iv)
        setTimeout(() => {
          const decoded = decodeClaimUrl(encoded)
          if (!decoded) {
            setPhase('invalid')
            return
          }
          setPayload(decoded)
          if (!authenticated) {
            setPhase('login')
          } else {
            setPhase('ready')
          }
        }, 500)
      }
    }, 32)
    return () => clearInterval(iv)
  }, [phase, fullHash, encoded, authenticated])

 
  useEffect(() => {
    if (phase !== 'ready' || !payload) return
    const target = parseFloat(payload.amount)
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
  }, [phase, payload])


  useEffect(() => {
    if (phase === 'login' && ready && authenticated && payload) {
      setPhase('ready')
    }
  }, [ready, authenticated, phase, payload])

  
  useEffect(() => {
    if (phase !== 'ready' || wallet) return

    const initWallet = async () => {
      try {
        if (!(window as any).starknet) {
          setError('No Starknet wallet found. Please install ArgentX or Braavos.')
          return
        }
        const onboarded = await onboardWithInjected()
        setWallet(onboarded)
      } catch (err: any) {
        console.error('Wallet init failed:', err)
        setError(err.message || 'Failed to connect wallet. Please try again.')
      }
    }

    initWallet()
  }, [phase, wallet])

  const handleClaim = async () => {
    if (!payload) return
    setPhase('claiming')
    setError(null)

    try {
      if (!wallet) throw new Error('Wallet not ready. Please try again.')

      const provider = (wallet as any).getProvider()

      
      const tongoKeyBigInt = BigInt(payload.tongoPrivateKey)
      const tongo = getTongoInstance(payload.token, tongoKeyBigInt, provider)

      const hash = await claimDrop(wallet, tongo, payload.token, payload.amount)
      setTxHash(hash)
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

        {phase === 'resolving' && (
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 13, color: '#6C63FF', letterSpacing: '0.04em', marginBottom: 24, minHeight: 22 }}>
              {hashText}<span style={{ animation: 'blink 0.9s step-end infinite', borderRight: '2px solid #6C63FF', paddingRight: 2 }} />
            </p>
            <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A' }}>RESOLVING DROP...</span>
          </div>
        )}

        {phase === 'login' && (
          <div className="materialize" style={{ maxWidth: 400, width: '100%', position: 'relative', zIndex: 10 }}>
            <div style={{ background: '#0C0C12', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '44px 40px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6C63FF', marginBottom: 24, opacity: 0.7 }}>
                RECIPIENT_AUTH_REQUIRED
              </div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: '#F0F0F8', marginBottom: 12, letterSpacing: '-0.02em' }}>
                Claim your drop.
              </h2>
              {payload && (
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 42, color: '#6C63FF', marginBottom: 16, letterSpacing: '-0.02em' }}>
                  {parseFloat(payload.amount).toFixed(2)} {payload.token}
                </div>
              )}
              <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 300, fontSize: 14, color: '#8A8A9A', marginBottom: 32, lineHeight: 1.7 }}>
                Sign in then connect your ArgentX or Braavos wallet to receive funds.
              </p>
              <button onClick={login} style={{ width: '100%', background: '#6C63FF', color: '#F0F0F8', padding: '18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                SIGN IN TO CLAIM →
              </button>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 300, fontStyle: 'italic', color: '#4A4A5A', marginTop: 20 }}>
                Requires ArgentX or Braavos extension.
              </p>
            </div>
          </div>
        )}

        {phase === 'ready' && payload && (
          <div className="materialize" style={{ maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6C63FF', marginBottom: 32, opacity: 0.65 }}>
              RECIPIENT_PAYLOAD_READY
            </p>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 'clamp(72px,14vw,104px)', color: '#6C63FF', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {displayAmt.toFixed(2)}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 'clamp(40px,8vw,68px)', color: '#6C63FF', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {payload.token}
              </div>
            </div>
            <div style={{ margin: '28px 0 48px' }}>
              <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A4A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                {payload.confidential ? 'CONFIDENTIAL' : 'PUBLIC'}
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#4A4A5A', display: 'inline-block' }} />
                ONE TIME
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#4A4A5A', display: 'inline-block' }} />
                POWERED BY STARKNET
              </p>
            </div>
            {error && (
              <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff6b6b', marginBottom: 16, padding: '10px 16px', background: 'rgba(255,107,107,0.08)', borderRadius: 6, border: '1px solid rgba(255,107,107,0.2)', width: '100%', maxWidth: 400 }}>
                {error}
              </div>
            )}
            <div style={{ width: '100%', maxWidth: 400 }}>
              <div className="pulse-wrap" style={{ width: '100%' }}>
                <div className="pulse-ring" style={{ inset: -10, borderRadius: 10 }} />
                <div className="pulse-ring pulse-ring-2" style={{ inset: -10, borderRadius: 10 }} />
                <button
                  onClick={handleClaim}
                  disabled={!wallet}
                  style={{ width: '100%', background: '#6C63FF', color: '#F0F0F8', padding: '20px 32px', borderRadius: 6, border: 'none', cursor: wallet ? 'pointer' : 'not-allowed', opacity: wallet ? 1 : 0.5, fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', zIndex: 1, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => { if (wallet) e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={e => { if (wallet) e.currentTarget.style.opacity = '1' }}
                >{wallet ? 'CLAIM →' : 'CONNECTING WALLET...'}</button>
              </div>
            </div>
            <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.28 }}>
              <span style={{ fontSize: 12 }}>🔒</span>
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A4A5A' }}>ENCRYPTED_LEDGER_ACCESS_SINGLE_SESSION</span>
            </div>
          </div>
        )}

        {phase === 'claiming' && (
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <div style={{ width: 48, height: 48, border: '2px solid #2C2C3A', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 0.85s linear infinite', margin: '0 auto 24px' }} />
            <p style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A' }}>
              WITHDRAWING FROM VAULT...
            </p>
          </div>
        )}

        {phase === 'claimed' && payload && (
          <div className="materialize" style={{ maxWidth: 400, width: '100%', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <div style={{ background: '#0C0C12', border: '1px solid rgba(44,44,58,0.4)', borderRadius: 8, padding: '44px 40px' }}>
              <div style={{ width: 52, height: 52, background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 22, color: '#6C63FF' }}>✓</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 34, color: '#F0F0F8', marginBottom: 12, letterSpacing: '-0.02em' }}>Funds received.</h2>
              <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 300, fontSize: 14, color: '#8A8A9A', marginBottom: 20, lineHeight: 1.7 }}>
                {payload.amount} {payload.token} landed in your wallet.<br />This link is now dead.
              </p>
              {txHash && (
                <a href={`https://voyager.online/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontFamily: "'Lato',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6C63FF', marginBottom: 28, textDecoration: 'none' }}>
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