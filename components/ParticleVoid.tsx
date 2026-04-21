'use client'
import { useEffect, useRef } from 'react'

export default function ParticleVoid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    let W: number, H: number
    const mouse = { x: -999, y: -999 }

    const particles: {
      x: number; y: number; r: number
      vx: number; vy: number; o: number
    }[] = []

    function init() {
      W = canvas!.width = window.innerWidth
      H = canvas!.height = window.innerHeight
      particles.length = 0
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.5 + 0.3,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          o: Math.random() * 0.35 + 0.08,
        })
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#050508'
      ctx.fillRect(0, 0, W, H)

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 65) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(108,99,255,${0.13 * (1 - d / 65)})`
            ctx.lineWidth = 0.4
            ctx.stroke()
          }
        }
      }

      // Particles
      particles.forEach(p => {
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 90) {
          p.vx -= (dx / dist) * 0.07
          p.vy -= (dy / dist) * 0.07
        }
        p.vx *= 0.97
        p.vy *= 0.97
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(108,99,255,${p.o})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const onLeave = () => { mouse.x = -999; mouse.y = -999 }
    const onResize = () => { init() }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', onResize)

    init()
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
