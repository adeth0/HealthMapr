import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextType {
  session:  Session | null
  user:     User | null
  loading:  boolean
  signInWithGoogle:    () => Promise<void>
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>
  signOut:             () => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Bootstrap: check for existing session (also processes OAuth hash tokens)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getSession().then(({ data }: any) => {
      setSession(data.session)
      setLoading(false)
    })

    // Keep session in sync on every auth event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Actions ─────────────────────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    // redirectTo must be the origin — Supabase appends #access_token=... to it
    const redirectTo = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  const signInWithMagicLink = async (email: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    })
    if (error) return { error: error.message }
    return {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
