'use client'
import Logo from '@/components/Logo'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

export default function Onboard() {
  const router = useRouter()
  const { ready, authenticated, login, user } = usePrivy()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  useEffect(() => {
    if (!ready || !authenticated) return
    if (!user) return

    const hasWallet = user.linkedAccounts?.some((a: any) => a.type === 'wallet')
    if (hasWallet) {
      router.push('/drop')
      return
    }

    fetch('/api/wallets/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
      .then(r => r.json())
      .then(data => {
        console.log('Wallet created:', data)
        router.push('/drop')
      })
      .catch(err => {
        console.error('Wallet creation failed:', err)
        router.push('/drop')
      })
  }, [ready, authenticated, user, router])

  const handleLogin = async () => {
    setLoading(true)
    try {
      await login()
    } catch (e) {
      console.error('Login failed:', e)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'rgba(108,99,255,0.05)', filter: 'blur(120px)', pointerEvents: 'none' }} />

        <div className={mounted ? 'materialize' : ''} style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 460, background: '#0C0C12', padding: '48px', borderRadius: 8, border: '1px solid rgba(44,44,58,0.4)', opacity: mounted ? undefined : 0 }}>

          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Logo />
          </div>

          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(34px,5vw,46px)', color: '#F0F0F8', lineHeight: '0.95em', letterSpacing: '-0.01em', marginBottom: 40 }}>
            Identify<br />yourself.
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={handleLogin}
              disabled={loading || !ready}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'transparent', border: '1px solid #2C2C3A', borderRadius: 6, cursor: (loading || !ready) ? 'not-allowed' : 'pointer', transition: 'background 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#14141C'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#2C2C3A' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F0F0F8' }}>
                  {loading ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}
                </span>
              </div>
              {loading
                ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(108,99,255,0.3)', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <span style={{ color: '#4A4A5A', fontSize: 16 }}>›</span>}
            </button>

            <button
              onClick={handleLogin}
              disabled={loading || !ready}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'transparent', border: '1px solid #2C2C3A', borderRadius: 6, cursor: (loading || !ready) ? 'not-allowed' : 'pointer', transition: 'background 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#14141C'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#2C2C3A' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8A9A" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" fill="#8A8A9A"/>
                  <path d="M22 11V9a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2"/>
                </svg>
                <span style={{ fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F0F0F8' }}>
                  {loading ? 'CONNECTING...' : 'CONNECT WALLET'}
                </span>
              </div>
              {loading
                ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(108,99,255,0.3)', borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <span style={{ color: '#4A4A5A', fontSize: 16 }}>›</span>}
            </button>
          </div>

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