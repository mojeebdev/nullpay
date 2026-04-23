'use client'
import Logo from '@/components/Logo'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

export default function Onboard() {
  const router = useRouter()
  const { ready, authenticated, login } = usePrivy()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    setTimeout(() => setMounted(true), 60)
  }, [])

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/dashboard')
    }
  }, [ready, authenticated, router])

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      
      await login()
    } catch (e: any) {
      console.error('Login failed:', e)
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'rgba(108,99,255,0.05)', filter: 'blur(120px)' }} />

        <div className={mounted ? 'materialize' : ''} style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 460, background: '#0C0C12', padding: '48px', borderRadius: 8, border: '1px solid rgba(44,44,58,0.4)' }}>

          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Logo />
          </div>

          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(34px,5vw,46px)', color: '#F0F0F8', lineHeight: '0.95em', letterSpacing: '-0.01em', marginBottom: 16 }}>
            Identify<br />yourself.
          </h1>

          <div style={{ marginBottom: 32, padding: '12px 16px', background: '#14141C', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13 }}>🦊</span>
            <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6C63FF', lineHeight: 1.6 }}>
              You'll need ArgentX or Braavos installed to send & receive drops
            </span>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !ready}
            style={{
              width: '100%',
              padding: '20px 24px',
              background: loading ? 'rgba(108,99,255,0.7)' : '#6C63FF',
              border: 'none',
              borderRadius: 8,
              cursor: loading || !ready ? 'not-allowed' : 'pointer',
              opacity: !ready ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!loading && ready) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { if (!loading && ready) e.currentTarget.style.opacity = '1' }}
          >
            {loading
              ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : null
            }
            <span style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F0F0F8' }}>
              {loading ? 'CONNECTING...' : 'SIGN IN →'}
            </span>
          </button>

          <p style={{ marginTop: 16, textAlign: 'center', fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 300, color: '#4A4A5A' }}>
            Google or Email — your choice inside
          </p>

          {error && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 6, textAlign: 'center' }}>
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: '#ff6b6b', letterSpacing: '0.1em' }}>{error}</span>
            </div>
          )}

          <div style={{ marginTop: 36, textAlign: 'center' }}>
            <p style={{ fontFamily: "'Lato',sans-serif", fontWeight: 300, fontSize: 13, fontStyle: 'italic', color: '#8A8A9A' }}>
              No seed phrase. No complexity.
            </p>
          </div>

          <div style={{ marginTop: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.18 }}>
            <div style={{ height: 1, width: 28, background: '#2C2C3A' }} />
            <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A4A5A' }}>LDR_SECURE_AUTH</span>
            <div style={{ height: 1, width: 28, background: '#2C2C3A' }} />
          </div>
        </div>
      </main>

      <footer style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 32 }} />
      </footer>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
