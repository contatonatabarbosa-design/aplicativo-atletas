import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

/** Nome, cor e logo do clube (aplicados a toda a interface via CSS var). */
export default function ClubSettings() {
  const { club, refreshClub } = useAuth()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#1c4d35')
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => { if (club) { setName(club.name); setColor(club.primary_color) } }, [club])
  if (!club) return null

  async function save(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('clubs').update({ name, primary_color: color }).eq('id', club!.id)
    setMsg(error ? error.message : 'Alterações salvas.')
    await refreshClub()
  }

  async function uploadLogo(file: File) {
    // A pasta precisa ser o club_id: a policy do Storage valida isso.
    const path = `${club!.id}/logo-${Date.now()}.${file.name.split('.').pop()}`
    const up = await supabase.storage.from('club-assets').upload(path, file, { upsert: true })
    if (up.error) return setMsg(up.error.message)
    const { data } = supabase.storage.from('club-assets').getPublicUrl(path)
    const { error } = await supabase.from('clubs').update({ logo_url: data.publicUrl }).eq('id', club!.id)
    setMsg(error ? error.message : 'Logo atualizado.')
    await refreshClub()
  }

  return (
    <section className="max-w-lg">
      <h1 className="text-4xl font-bold mb-4">Configuração do clube</h1>
      <form onSubmit={save} className="card space-y-3">
        <div><label className="label" htmlFor="cn">Nome do clube</label><input id="cn" className="input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div><label className="label" htmlFor="cc">Cor principal</label><input id="cc" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20" /></div>
        <div>
          <label className="label" htmlFor="cl">Logo</label>
          {club.logo_url && <img src={club.logo_url} alt="Logo atual" className="h-16 mb-2 rounded" />}
          <input id="cl" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
        </div>
        {msg && <p role="status" className="text-sm">{msg}</p>}
        <button className="btn">Salvar alterações</button>
      </form>
    </section>
  )
}
