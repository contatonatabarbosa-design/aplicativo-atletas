import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { hexToRgbTriplet } from '../lib/calc'
import type { Club, Profile } from '../types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  club: Club | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  /** Cria conta de gestor + novo clube (a trigger do banco monta clube e perfil). */
  signUpManager: (p: { email: string; password: string; fullName: string; clubName: string }) => Promise<string | null>
  /** Primeiro acesso do atleta: o e-mail precisa já estar cadastrado pelo gestor. */
  signUpAthlete: (p: { email: string; password: string; fullName: string }) => Promise<string | null>
  signOut: () => Promise<void>
  refreshClub: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)
export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth fora do AuthProvider')
  return v
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)

  const loadContext = useCallback(async (uid: string | null) => {
    if (!uid) { setProfile(null); setClub(null); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    setProfile(p as Profile | null)
    if (p) {
      const { data: c } = await supabase.from('clubs').select('*').eq('id', p.club_id).maybeSingle()
      setClub(c as Club | null)
    } else setClub(null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadContext(data.session?.user.id ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      // Evita chamar o Supabase dentro do callback (risco de deadlock): adia um tick.
      setTimeout(() => loadContext(s?.user.id ?? null), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadContext])

  // Aplica a cor do clube em toda a interface.
  useEffect(() => {
    document.documentElement.style.setProperty('--brand', hexToRgbTriplet(club?.primary_color ?? '#1c4d35'))
  }, [club?.primary_color])

  const value: AuthState = {
    session, profile, club, loading,
    signIn: async (email, password) => (await supabase.auth.signInWithPassword({ email, password })).error?.message ?? null,
    signUpManager: async ({ email, password, fullName, clubName }) =>
      (await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, club_name: clubName } } })).error?.message ?? null,
    signUpAthlete: async ({ email, password, fullName }) =>
      (await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })).error?.message ?? null,
    signOut: async () => { await supabase.auth.signOut() },
    refreshClub: async () => loadContext(session?.user.id ?? null),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
