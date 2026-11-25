import { useMyAthlete } from '../../hooks/useMyAthlete'
import { classifyBmi, fmtDate } from '../../lib/calc'

/** Ficha do atleta (somente leitura; edição é feita pela comissão técnica). */
export default function MyProfile() {
  const { data: a, isLoading } = useMyAthlete()
  if (isLoading) return <p>Carregando…</p>
  if (!a) return <p>Sua ficha ainda não foi vinculada. Fale com a comissão técnica.</p>
  const bmi = classifyBmi(a.bmi)
  const rows: [string, React.ReactNode][] = [
    ['Data de nascimento', `${fmtDate(a.birth_date)}${a.age != null ? ` (${a.age} anos)` : ''}`],
    ['Contato', a.phone ?? a.email ?? '—'],
    ['Altura', a.height_cm ? `${a.height_cm} cm` : '—'],
    ['Peso', a.weight_kg ? `${a.weight_kg} kg` : '—'],
    ['IMC', a.bmi ? <span className={`badge ${bmi.className}`}>{a.bmi} · {bmi.label}</span> : '—'],
    ['Início no clube', fmtDate(a.joined_at)],
    ['Posição', a.position ?? '—'],
    ['Mensalidade', <span className={`badge ${a.payment_status === 'paid' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>{a.payment_status === 'paid' ? 'Em dia' : 'Pendente'}</span>],
  ]
  return (
    <section className="max-w-2xl">
      <div className="flex items-end gap-4 mb-4">
        <span className="font-display text-7xl font-bold text-brand leading-none">{a.jersey_number ?? '—'}</span>
        <h1 className="text-4xl font-bold">{a.full_name}</h1>
      </div>
      <dl className="card grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([k, v]) => <div key={k}><dt className="text-xs text-turf-700">{k}</dt><dd className="text-sm font-medium">{v}</dd></div>)}
      </dl>
      <p className="text-xs text-turf-700 mt-2">O IMC é uma referência geral e pode superestimar a gordura em atletas com muita massa muscular.</p>
    </section>
  )
}
