// Temporary type shim — only used when @supabase/supabase-js isn't installed.
// The real package types override this automatically once `npm install` is run.
declare module '@supabase/supabase-js' {
  export interface Session { user: User; access_token: string; refresh_token: string }
  export interface User { id: string; email?: string; user_metadata: Record<string, unknown> }
  export function createClient(url: string, key: string, opts?: Record<string, unknown>): SupabaseClient

  export interface SupabaseClient {
    auth: {
      getSession(): Promise<{ data: { session: Session | null } }>
      onAuthStateChange(cb: (event: string, session: Session | null) => void): { data: { subscription: { unsubscribe(): void } } }
      signInWithOAuth(opts: Record<string, unknown>): Promise<{ error: Error | null }>
      signInWithOtp(opts: Record<string, unknown>): Promise<{ error: Error | null }>
      signOut(): Promise<void>
    }
    from(table: string): QueryBuilder
  }

  interface QueryBuilder {
    select(cols: string): this
    insert(data: Record<string, unknown>): this
    upsert(data: Record<string, unknown>, opts?: Record<string, unknown>): this
    eq(col: string, val: unknown): this
    gte(col: string, val: unknown): this
    order(col: string, opts?: Record<string, unknown>): this
    maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: Error | null }>
    then(onfulfilled: (v: { data: unknown; error: Error | null }) => void): void
  }
}
