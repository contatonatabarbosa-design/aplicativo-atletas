import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import StatCard from '../../components/StatCard'
import { classifyBmi, fmtDate } from '../../lib/calc'
import type { Athlete } from '../../types'

/** Painel macro do gestor: cards de resumo + atividade recente de treinos. */
export default function Dashboard() {
  const athletes = useQuery({
    queryKey: ['athletes_overview', 'dash'],
    queryFn: async () => (await supabase.from('athletes_overview').select('*').eq('status', 'active')).data as Athlete[] ?? [],
  })
  const recent = useQuery({
    queryKey: ['recent-workouts'],
    queryFn: async () => (await supabase.from('workout_logs').select('*, athletes(full_name)').order('created_at', { ascending: false }).limit(8)).data ?? [],
  })
  const week = useQuery({
    queryKey: ['workouts-7d'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)
      const { count } = await supabase.from('workout_logs').select('id', { count: 'exact', head: true }).gte('logged_on', since)
      return count ?? 0
    },
  })

  const list = athletes.data ?? []
  const paid = list.filter((a) => a.payment_status === 'paid').length
  const bmis = list.map((a) => a.bmi).filter((b): b is number => b != null)
  const avgBmi = bmis.length ? Math.round((bmis.reduce((s, b) => s + b, 0) / bmis.length) * 10) / 10 : null

  return (
    <section>
      <h1 className="text-4xl font-bold mb-4">Painel do clube</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Atletas ativos" value={list.length} />
        <StatCard label="Mensalidades em dia" value={`${paid} / ${list.length}`} hint={`${list.length - paid} pendentes`} />
        <StatCard label="IMC médio do elenco" value={avgBmi ?? '—'} hint={classifyBmi(avgBmi).label} />
        <StatCard label="Treinos nos últimos 7 dias" value={week.data ?? 0} />
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-2">Atividade recente</h2>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead><tr><th className="th">Data</th><th className="th">Atleta</th><th className="th">Exercício</th><th className="th">Resultado</th></tr></thead>
          <tbody>
            {(recent.data ?? []).map((w: any) => (
              <tr key={w.id}>
                <td className="td">{fmtDate(w.logged_on)}</td>
                <td className="td">{w.athletes?.full_name}</td>
                <td className="td">{w.exercise}</td>
                <td className="td">{w.load_kg ? `${w.load_kg} kg × ${w.sets ?? '?'}×${w.reps ?? '?'}` : w.speed_kmh ? `${w.speed_kmh} km/h` : w.duration_seconds ? `${w.duration_seconds} s` : '—'}</td>
              </tr>
            ))}
            {!recent.data?.length && <tr><td className="td text-turf-700" colSpan={4}>Nenhum treino registrado ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
