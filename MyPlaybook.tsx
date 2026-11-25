import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useMyAthlete } from '../../hooks/useMyAthlete'
import type { Playbook } from '../../types'

/** Playbook organizado em Geral / Minha posição. A RLS já filtra por posição. */
export default function MyPlaybook() {
  const { data: me } = useMyAthlete()
  const [tab, setTab] = useState<'general' | 'position'>('general')
  const [q, setQ] = useState('')
  const { data = [] } = useQuery({
    queryKey: ['my-playbook'],
    queryFn: async () => (await supabase.from('playbooks').select('*').order('title')).data as Playbook[] ?? [],
  })
  const items = data.filter((p) => p.scope === tab && `${p.title} ${p.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <section>
      <h1 className="text-4xl font-bold mb-3">Playbook</h1>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist">
        <button role="tab" aria-selected={tab === 'general'} className={tab === 'general' ? 'btn' : 'btn-ghost'} onClick={() => setTab('general')}>Geral</button>
        <button role="tab" aria-selected={tab === 'position'} className={tab === 'position' ? 'btn' : 'btn-ghost'} onClick={() => setTab('position')}>Minha posição{me?.position ? ` (${me.position})` : ''}</button>
        <input className="input max-w-xs" placeholder="Buscar por título ou tag" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((p) => (
          <article key={p.id} className="card">
            <h2 className="text-2xl font-bold">{p.title}</h2>
            {p.content && <p className="text-sm whitespace-pre-line mt-1">{p.content}</p>}
            <div className="flex flex-wrap gap-1 mt-2">{p.tags.map((t) => <span key={t} className="badge bg-turf-100">{t}</span>)}</div>
            <div className="mt-2 space-y-2">
              {p.media_urls.map((u) => /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(u)
                ? <img key={u} src={u} alt={p.title} className="rounded max-h-64" />
                : <a key={u} href={u} target="_blank" rel="noreferrer" className="block text-sm underline break-all">{u}</a>)}
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="text-sm text-turf-700">Nada publicado aqui ainda.</p>}
      </div>
    </section>
  )
}
