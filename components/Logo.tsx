export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scales = { sm: 0.7, md: 1, lg: 1.4 }
  const s = scales[size]
  const w = Math.round(140 * s)
  const h = Math.round(32 * s)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={w}
      height={h}
      viewBox="0 0 140 32"
      aria-label="NullPay"
    >
      {/* Hex mark */}
      <polygon
        points="12,4 22,0 32,4 32,16 22,20 12,16"
        fill="none" stroke="#6C63FF" strokeWidth="1"
      />
      <circle cx="22" cy="10" r="7.5" fill="none" stroke="#6C63FF" strokeWidth="1.2"/>
      <line x1="16.5" y1="4.5" x2="27.5" y2="15.5" stroke="#6C63FF" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="22" cy="10" r="2" fill="#6C63FF"/>
      {/* Wordmark */}
      <text
        x="40" y="15"
        fontFamily="'Playfair Display', serif"
        fontWeight="900"
        fontSize="18"
        letterSpacing="-0.3"
        fill="#F0F0F8"
      >NULL</text>
      <text
        x="83" y="15"
        fontFamily="'Playfair Display', serif"
        fontWeight="900"
        fontSize="18"
        letterSpacing="-0.3"
        fill="#6C63FF"
      >PAY</text>
    </svg>
  )
}