import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useMyAthlete } from '../../hooks/useMyAthlete'
import Modal from '../../components/Modal'
import { fmtDate } from '../../lib/calc'
import type { Drill, DrillCompletion } from '../../types'

/** Drills da posição do atleta + registro de conclusão com observações. */
export default function MyDrills() {
  const { data: me } = useMyAthlete()
  const qc = useQueryClient()
  const [target, setTarget] = useState<Drill | null>(null)
  const [notes, setNotes] = useState('')

  const drills = useQuery({ queryKey: ['my-drills'], queryFn: async () => (await supabase.from('drills').select('*').order('title')).data as Drill[] ?? [] })
  const done = useQuery({
    queryKey: ['my-completions'], enabled: !!me,
    queryFn: async () => (await supabase.from('drill_completions').select('*').eq('athlete_id', me!.id).order('completed_at', { ascending: false })).data as DrillCompletion[] ?? [],
  })
  const complete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('drill_completions').insert({ drill_id: target!.id, athlete_id: me!.id, notes: notes || null })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-completions'] }); setTarget(null); setNotes('') },
  })

  return (
    <section>
      <h1 className="text-4xl font-bold mb-4">Drills{me?.position ? ` de ${me.position}` : ''}</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {(drills.data ?? []).map((d) => {
          const mine = (done.data ?? []).filter((c) => c.drill_id === d.id)
          return (
            <article key={d.id} className="card">
              <h2 className="text-2xl font-bold">{d.title}</h2>
              {d.objective && <p className="text-sm mt-1"><b>Objetivo:</b> {d.objective}</p>}
              {d.instructions && <p className="text-sm mt-1 whitespace-pre-line">{d.instructions}</p>}
              {d.media_url && <a href={d.media_url} target="_blank" rel="noreferrer" className="text-sm underline block mt-1">Ver vídeo/imagem</a>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-turf-700">{mine.length ? `Feito ${mine.length}× · último em ${fmtDate(mine[0].completed_at)}` : 'Ainda não feito'}</span>
                <button className="btn" onClick={() => setTarget(d)}>Registrar conclusão</button>
              </div>
              {mine[0]?.notes && <p className="text-xs mt-2 bg-turf-100 rounded p-2">Sua observação: {mine[0].notes}</p>}
            </article>
          )
        })}
        {drills.data?.length === 0 && <p className="text-sm text-turf-700">Nenhum drill para a sua posição ainda.</p>}
      </div>
      {target && (
        <Modal title={target.title} onClose={() => setTarget(null)}>
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); complete.mutate() }} className="space-y-3">
            <label className="label" htmlFor="obs">Observações (opcional)</label>
            <textarea id="obs" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            {complete.error && <p role="alert" className="text-sm text-red-700">{(complete.error as Error).message}</p>}
            <button className="btn" disabled={complete.isPending}>Marcar como concluído</button>
          </form>
        </Modal>
      )}
    </section>
  )
}
