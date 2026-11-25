import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'athlete' | 'club'

export default function Login() {
  const { session, signIn, signUpAthlete, signUpManager } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [f, setF] = useState({ email: '', password: '', fullName: '', clubName: '' })
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (session) return <Navigate to="/" replace />

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null)
    const err = mode === 'login' ? await signIn(f.email, f.password)
      : mode === 'athlete' ? await signUpAthlete(f)
      : await signUpManager(f)
    setBusy(false)
    if (err) setMsg(err)
    else if (mode !== 'login') setMsg('Conta criada. Se o projeto exigir confirmação por e-mail, confirme antes de entrar.')
  }

  return (
    <div className="min-h-screen grid place-items-center bg-turf-900 p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <h1 className="text-4xl font-bold">{mode === 'login' ? 'Entrar' : mode === 'athlete' ? 'Primeiro acesso do atleta' : 'Criar clube'}</h1>
        {mode === 'athlete' && <p className="text-sm">Use o mesmo e-mail que a comissão técnica cadastrou para você.</p>}
        {mode !== 'login' && <div><label className="label" htmlFor="n">Seu nome</label><input id="n" className="input" required value={f.fullName} onChange={set('fullName')} /></div>}
        {mode === 'club' && <div><label className="label" htmlFor="c">Nome do clube</label><input id="c" className="input" required value={f.clubName} onChange={set('clubName')} /></div>}
        <div><label className="label" htmlFor="e">E-mail</label><input id="e" type="email" className="input" required value={f.email} onChange={set('email')} /></div>
        <div><label className="label" htmlFor="p">Senha</label><input id="p" type="password" minLength={6} className="input" required value={f.password} onChange={set('password')} /></div>
        {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
        <div className="flex flex-col gap-1 text-sm">
          {mode !== 'login' && <button type="button" className="underline text-left" onClick={() => setMode('login')}>Já tenho conta</button>}
          {mode !== 'athlete' && <button type="button" className="underline text-left" onClick={() => setMode('athlete')}>Sou atleta e vou acessar pela primeira vez</button>}
          {mode !== 'club' && <button type="button" className="underline text-left" onClick={() => setMode('club')}>Quero cadastrar meu clube</button>}
        </div>
      </form>
    </div>
  )
}
