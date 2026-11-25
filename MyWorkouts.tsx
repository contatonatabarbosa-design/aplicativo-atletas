import { FormEvent, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useMyAthlete } from '../../hooks/useMyAthlete'
import { fmtDate } from '../../lib/calc'
import type { WorkoutLog } from '../../types'

const METRICS = [
  { key: 'load_kg', label: 'Carga (kg)' }, { key: 'speed_kmh', label: 'Velocidade (km/h)' },
  { key: 'distance_m', label: 'Distância (m)' }, { key: 'duration_seconds', label: 'Tempo (s)' },
] as const

const today = () => new Date().toISOString().slice(0, 10)
const emptyForm = { logged_on: today(), category: 'gym', exercise: '', muscle_group: '', load_kg: '', sets: '', reps: '', distance_m: '', speed_kmh: '', duration_seconds: '', notes: '' }

/** Registro de treinos (academia/performance), histórico e gráfico de evolução. */
export default function MyWorkouts() {
  const { data: me } = useMyAthlete()
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [exercise, setExercise] = useState('')
  const [metric, setMetric] = useState<(typeof METRICS)[number]['key']>('load_kg')

  const logs = useQuery({
    queryKey: ['my-workouts'], enabled: !!me,
    queryFn: async () => (await supabase.from('workout_logs').select('*').eq('athlete_id', me!.id).order('logged_on', { ascending: false }).order('created_at', { ascending: false })).data as WorkoutLog[] ?? [],
  })

  const add = useMutation({
    mutationFn: async () => {
      const n = (s: string) => (s === '' ? null : Number(s))
      const { error } = await supabase.from('workout_logs').insert({
        athlete_id: me!.id, logged_on: form.logged_on, category: form.category, exercise: form.exercise.trim(),
        muscle_group: form.muscle_group || null, load_kg: n(form.load_kg), sets: n(form.sets), reps: n(form.reps),
        distance_m: n(form.distance_m), speed_kmh: n(form.speed_kmh), duration_seconds: n(form.duration_seconds), notes: form.notes || null,
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-workouts'] }); setForm({ ...emptyForm, category: form.category }) },
  })
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('workout_logs').delete().eq('id', id); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-workouts'] }),
  })

  const all = logs.data ?? []
  const exercises = useMemo(() => [...new Set(all.map((l) => l.exercise))].sort(), [all])
  const current = exercise || exercises[0] || ''
  const series = all.filter((l) => l.exercise === current && l[metric] != null).map((l) => ({ date: fmtDate(l.logged_on), value: l[metric] })).reverse()

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value })
  const num = (k: keyof typeof emptyForm, label: string, step = '1') => (
    <div><label className="label" htmlFor={k}>{label}</label><input id={k} type="number" inputMode="decimal" step={step} min="0" className="input" value={form[k]} onChange={set(k)} /></div>
  )

  return (
    <section>
      <h1 className="text-4xl font-bold mb-4">Treinos e performance</h1>
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); add.mutate() }} className="card grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className="label" htmlFor="d">Data</label><input id="d" type="date" className="input" required value={form.logged_on} onChange={set('logged_on')} /></div>
        <div><label className="label" htmlFor="cat">Tipo</label>
          <select id="cat" className="input" value={form.category} onChange={set('category')}><option value="gym">Academia</option><option value="performance">Performance</option></select></div>
        <div className="col-span-2"><label className="label" htmlFor="ex">Exercício</label><input id="ex" className="input" required value={form.exercise} onChange={set('exercise')} placeholder={form.category === 'gym' ? 'Ex.: Agachamento' : 'Ex.: Sprint 40 jardas'} list="ex-list" /></div>
        <datalist id="ex-list">{exercises.map((x) => <option key={x} value={x} />)}</datalist>
        {form.category === 'gym' ? <>
          <div className="col-span-2 md:col-span-1"><label className="label" htmlFor="mg">Grupo muscular</label><input id="mg" className="input" value={form.muscle_group} onChange={set('muscle_group')} /></div>
          {num('load_kg', 'Carga (kg)', '0.5')}{num('sets', 'Séries')}{num('reps', 'Repetições')}
        </> : <>
          {num('distance_m', 'Distância (m)', '0.1')}{num('speed_kmh', 'Velocidade (km/h)', '0.01')}{num('duration_seconds', 'Tempo (s)', '0.01')}
        </>}
        <div className="col-span-2 md:col-span-4"><label className="label" htmlFor="nt">Observações</label><input id="nt" className="input" value={form.notes} onChange={set('notes')} /></div>
        {add.error && <p role="alert" className="col-span-full text-sm text-red-700">{(add.error as Error).message}</p>}
        <div className="col-span-full"><button className="btn" disabled={add.isPending || !me}>Salvar treino</button></div>
      </form>

      <h2 className="text-2xl font-bold mt-8 mb-2">Minha evolução</h2>
      {exercises.length === 0 ? <p className="text-sm text-turf-700">Registre seu primeiro treino para ver o gráfico.</p> : (
        <div className="card">
          <div className="flex flex-wrap gap-2 mb-3">
            <select className="input w-auto" value={current} onChange={(e) => setExercise(e.target.value)} aria-label="Exercício">{exercises.map((x) => <option key={x}>{x}</option>)}</select>
            <select className="input w-auto" value={metric} onChange={(e) => setMetric(e.target.value as typeof metric)} aria-label="Métrica">{METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
          </div>
          {series.length < 1 ? <p className="text-sm text-turf-700">Sem dados desta métrica para o exercício.</p> : (
            <div className="h-64"><ResponsiveContainer>
              <LineChart data={series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                <Line type="monotone" dataKey="value" name={METRICS.find((m) => m.key === metric)!.label} stroke="rgb(var(--brand))" strokeWidth={3} dot /></LineChart>
            </ResponsiveContainer></div>)}
        </div>)}

      <h2 className="text-2xl font-bold mt-8 mb-2">Histórico</h2>
      <div className="card p-0 overflow-x-auto"><table className="w-full">
        <thead><tr><th className="th">Data</th><th className="th">Exercício</th><th className="th">Carga</th><th className="th">Séries×Reps</th><th className="th">Dist.</th><th className="th">Veloc.</th><th className="th">Tempo</th><th className="th" /></tr></thead>
        <tbody>{all.map((l) => (
          <tr key={l.id}><td className="td">{fmtDate(l.logged_on)}</td><td className="td">{l.exercise}</td>
            <td className="td">{l.load_kg ?? '—'}</td><td className="td">{l.sets ? `${l.sets}×${l.reps ?? '?'}` : '—'}</td>
            <td className="td">{l.distance_m ?? '—'}</td><td className="td">{l.speed_kmh ?? '—'}</td><td className="td">{l.duration_seconds ?? '—'}</td>
            <td className="td"><button className="btn-ghost" onClick={() => confirm('Excluir este registro?') && del.mutate(l.id)}>Excluir</button></td></tr>))}
          {all.length === 0 && <tr><td className="td text-turf-700" colSpan={8}>Nenhum treino registrado.</td></tr>}</tbody>
      </table></div>
    </section>
  )
}
