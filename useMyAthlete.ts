import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Athlete } from '../types'

/** Ficha do atleta logado (RLS já garante que só retorna a própria). */
export function useMyAthlete() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['my-athlete', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('athletes_overview').select('*').eq('profile_id', session!.user.id).maybeSingle()
      if (error) throw error
      return data as Athlete | null
    },
  })
}
