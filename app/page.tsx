'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Logo from '@/components/Logo'

const ParticleVoid = dynamic(() => import('@/components/ParticleVoid'), { ssr: false })

export default function Landing() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 120) }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ANIMATION 01 — Particle void background */}
      <ParticleVoid />

      {/* Nav */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 32px',
      }}>
        <Logo />
        <nav style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <a href="#" style={{ fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6C63FF', borderBottom: '2px solid #6C63FF', paddingBottom: 3, textDecoration: 'none' }}>STARKNET</a>
          <a href="#" style={{ fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8A9A', textDecoration: 'none' }}>ASSETS</a>
          <a href="#" style={{ fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8A9A', textDecoration: 'none' }}>LEDGER</a>
        </nav>
        <Link href="/onboard" style={{
          fontFamily: "'Lato',sans-serif", fontSize: 11, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#F0F0F8', border: '1px solid #2C2C3A',
          padding: '10px 20px', textDecoration: 'none',
        }}>CONNECT_WALLET</Link>
      </header>

      {/* Hero */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
      }}>
        {visible && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

            {/* ANIMATION 02 — Glitch title */}
            <h1
              className="glitch fade-up fade-up-1"
              data-text="NULLPAY"
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 900,
                fontSize: 'clamp(72px,12vw,130px)',
                color: '#F0F0F8',
                letterSpacing: '-0.02em',
                lineHeight: '0.95em',
                marginBottom: 20,
              }}
            >NULLPAY</h1>

            <p className="fade-up fade-up-2" style={{
              fontFamily: "'Lato',sans-serif", fontWeight: 300,
              fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#8A8A9A', marginBottom: 52,
            }}>SEND MONEY. LEAVE NO TRACE.</p>

            <div className="fade-up fade-up-3" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/onboard" style={{
                fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 12,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: '#F0F0F8', background: '#6C63FF',
                padding: '18px 48px', borderRadius: 6, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 10,
              }}>ENTER <span>→</span></Link>
              <a href="https://github.com/mojeebdev/nullpay" target="_blank" rel="noopener noreferrer" style={{
                fontFamily: "'Lato',sans-serif", fontWeight: 700, fontSize: 12,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: '#8A8A9A', background: 'transparent',
                border: '1px solid #2C2C3A',
                padding: '18px 32px', borderRadius: 6, textDecoration: 'none',
              }}>VIEW SOURCE</a>
            </div>

            {/* Feature pills */}
            <div className="fade-up fade-up-4" style={{ marginTop: 72, display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[['No wallet needed', 'to receive'], ['Amount hidden', 'on-chain'], ['One-time link', 'self-destructs']].map(([t, s]) => (
                <div key={t} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: '#F0F0F8', marginBottom: 4 }}>{t}</div>
                  <div style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A4A5A' }}>{s}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, padding: '28px 24px', pointerEvents: 'none',
      }}>

        <span style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A4A5A', opacity: 0.5 }}>
          © 2026 NULLPAY. PRECISION_LEDGER_ENCRYPTED.
        </span>
      </footer>
    </div>
  )
}
