// Animated gradient mesh background — Apple Vision Pro / iOS 17 aesthetic
export default function GradientMesh() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Base */}
      <div className="absolute inset-0" style={{ background: 'var(--bg-base)' }} />

      {/* Blob 1 — Blue top-right */}
      <div
        className="absolute rounded-full animate-blob"
        style={{
          width: 700,
          height: 700,
          top: -200,
          right: -150,
          background: 'radial-gradient(circle, rgba(10,132,255,0.35) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animationDelay: '0s',
        }}
      />

      {/* Blob 2 — Purple bottom-left */}
      <div
        className="absolute rounded-full animate-blob"
        style={{
          width: 600,
          height: 600,
          bottom: -150,
          left: -120,
          background: 'radial-gradient(circle, rgba(191,90,242,0.28) 0%, transparent 70%)',
          filter: 'blur(70px)',
          animationDelay: '-4s',
        }}
      />

      {/* Blob 3 — Teal mid */}
      <div
        className="absolute rounded-full animate-blob"
        style={{
          width: 450,
          height: 450,
          top: '35%',
          left: '30%',
          background: 'radial-gradient(circle, rgba(100,210,255,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animationDelay: '-8s',
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '150px',
          opacity: 0.4,
        }}
      />
    </div>
  )
}
