import { createClient } from '@supabase/supabase-js'

// Variáveis definidas em .env (local) ou no painel da Vercel/Netlify (produção).
const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente.')
}

// A anon key é pública por design: a segurança real vem da RLS no banco.
export const supabase = createClient(url, anon)
