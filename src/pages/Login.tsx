import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import { useAuth } from '@/contexts/AuthContext'

// ── Google "G" SVG logo ────────────────────────────────────────────────────────

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Email confirmation state ───────────────────────────────────────────────────

function MagicLinkSent({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center text-center py-4 animate-fade-in">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-5"
        style={{
          background: 'linear-gradient(135deg, rgba(10,132,255,0.2), rgba(191,90,242,0.15))',
          border: '1px solid rgba(10,132,255,0.3)',
          boxShadow: '0 0 30px rgba(10,132,255,0.2)',
        }}
      >
        ✉️
      </div>
      <h3 className="text-[20px] font-bold text-white/90 mb-2">Check your inbox</h3>
      <p className="text-[14px] text-white/50 leading-relaxed max-w-[260px]">
        We sent a magic link to <span className="text-white/80 font-semibold">{email}</span>.
        Click it to sign in — no password needed.
      </p>
      <p className="text-[12px] text-white/30 mt-4">
        Link expires in 60 minutes. Check spam if you don't see it.
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Login() {
  const { signInWithGoogle, signInWithMagicLink, user, loading } = useAuth()
  const navigate = useNavigate()

  // Already logged in → skip straight to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  const [email, setEmail]           = useState('')
  const [emailSent, setEmailSent]   = useState(false)
  const [sentTo, setSentTo]         = useState('')
  const [emailError, setEmailError] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await signInWithGoogle() // redirects — loading state clears on return
    setGoogleLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!email.includes('@')) {
      setEmailError('Please enter a valid email address')
      return
    }

    setSendingEmail(true)
    const result = await signInWithMagicLink(email)
    setSendingEmail(false)

    if (result.error) {
      setEmailError(result.error)
    } else {
      setSentTo(email)
      setEmailSent(true)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 relative overflow-hidden">
      <GradientMesh />

      {/* Back to landing */}
      <Link
        to="/"
        className="absolute top-6 left-5 flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors"
        style={{ paddingTop: 'max(0px, var(--safe-top))' }}
      >
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
          <path d="M6 1L1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-[32px] p-8 animate-slide-up"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderTop: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(60px)',
          WebkitBackdropFilter: 'blur(60px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        {/* Logo + branding */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="HealthMapr"
            className="w-16 h-16 rounded-[20px] mb-4"
            style={{ boxShadow: '0 4px 24px rgba(10,132,255,0.35)' }}
          />
          <h1 className="text-[22px] font-black text-white/95" style={{ letterSpacing: '-0.02em' }}>
            Sign in to HealthMapr
          </h1>
          <p className="text-[13px] text-white/45 mt-1 text-center">
            Your health data, private and personal
          </p>
        </div>

        {emailSent ? (
          <MagicLinkSent email={sentTo} />
        ) : (
          <>
            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl font-semibold text-[15px] mb-5 transition-all active-press"
              style={{
                background: googleLoading ? 'rgba(255,255,255,0.85)' : '#ffffff',
                color: '#1f1f1f',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
                opacity: googleLoading ? 0.7 : 1,
              }}
            >
              {googleLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-gray-400 border-t-gray-700 animate-spin" />
              ) : (
                <GoogleLogo />
              )}
              <span>{googleLoading ? 'Redirecting…' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.09)' }} />
              <span className="text-[12px] text-white/30 font-medium">or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.09)' }} />
            </div>

            {/* Magic link form */}
            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <div
                className="input-field rounded-2xl px-4 py-3.5"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                  autoComplete="email"
                  className="text-[15px] text-white/90 placeholder:text-white/25 w-full bg-transparent outline-none"
                />
              </div>

              {emailError && (
                <p className="text-[12px] text-[#FF453A] px-1">{emailError}</p>
              )}

              <button
                type="submit"
                disabled={sendingEmail || !email}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white transition-all active-press"
                style={{
                  background: email
                    ? 'linear-gradient(135deg, #0A84FF, #BF5AF2)'
                    : 'rgba(255,255,255,0.08)',
                  color: email ? '#fff' : 'rgba(255,255,255,0.25)',
                  boxShadow: email ? '0 4px 20px rgba(10,132,255,0.35)' : 'none',
                  opacity: sendingEmail ? 0.7 : 1,
                }}
              >
                {sendingEmail ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          </>
        )}

        {/* Trust footer */}
        <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[11px] text-white/25 text-center leading-relaxed">
            🔒 No passwords stored. Your health data is private and encrypted.
            <br />
            By signing in you agree to our{' '}
            <a href="#" className="text-white/40 hover:text-white/60 underline">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-white/40 hover:text-white/60 underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
