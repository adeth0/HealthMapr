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
    // Use ONLY onAuthStateChange — not getSession() — so that loading stays true
    // until Supabase has fully processed the URL (OAuth hash tokens, magic links,
    // PKCE codes). getSession() can resolve before detectSessionInUrl finishes,
    // which would prematurely show the user as logged-out.
    //
    // onAuthStateChange fires INITIAL_SESSION after the full init (including URL
    // token detection), so we only lower the loading flag then.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setSession(session)
      // INITIAL_SESSION fires once the client has finished bootstrapping.
      // All other events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED …) also
      // lower the flag so subsequent auth changes are reflected instantly.
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Actions ─────────────────────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    // With PKCE flow, Supabase redirects back as ?code=xxx (query param, not hash).
    // HashRouter only reads the hash, so the code is safe from route clobbering.
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  const signInWithMagicLink = async (email: string): Promise<{ error?: string }> => {
    // emailRedirectTo: Supabase verifies the magic link server-side, then
    // redirects here with ?code=xxx (PKCE) — never touches the hash.
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
