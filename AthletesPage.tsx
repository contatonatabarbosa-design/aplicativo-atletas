import { useState } from 'react'
import CrudPage, { FieldDef } from '../../components/CrudPage'
import { calcAge, calcBmi, classifyBmi, fmtDate } from '../../lib/calc'
import { POSITION_OPTIONS } from '../../lib/constants'

const fields: FieldDef[] = [
  { name: 'full_name', label: 'Nome completo', required: true, full: true },
  { name: 'email', label: 'E-mail (login do atleta)', type: 'email', hint: 'Com este e-mail o atleta faz o primeiro acesso.' },
  { name: 'phone', label: 'Contato' },
  { name: 'birth_date', label: 'Data de nascimento', type: 'date' },
  { name: 'joined_at', label: 'Início no clube', type: 'date' },
  { name: 'height_cm', label: 'Altura (cm)', type: 'number', step: '0.1' },
  { name: 'weight_kg', label: 'Peso (kg)', type: 'number', step: '0.1' },
  { name: 'position', label: 'Posição', type: 'select', options: POSITION_OPTIONS },
  { name: 'jersey_number', label: 'Nº da camisa', type: 'number' },
  { name: 'status', label: 'Situação', type: 'select', required: true, options: [{ value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' }] },
]

export default function AthletesPage() {
  const [pos, setPos] = useState('')
  const [pay, setPay] = useState('')
  return (
    <CrudPage
      table="athletes" readSource="athletes_overview" title="Atletas" singular="atleta"
      fields={fields} orderBy={{ column: 'full_name' }} defaults={{ status: 'active' }}
      searchText={(r) => `${r.full_name} ${r.email ?? ''} ${r.jersey_number ?? ''}`}
      filterFn={(r) => (!pos || r.position === pos) && (!pay || r.payment_status === pay)}
      toolbar={<>
        <select className="input w-auto" value={pos} onChange={(e) => setPos(e.target.value)} aria-label="Filtrar por posição">
          <option value="">Todas as posições</option>{POSITION_OPTIONS.map((o) => <option key={o.value}>{o.value}</option>)}
        </select>
        <select className="input w-auto" value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Filtrar por mensalidade">
          <option value="">Toda mensalidade</option><option value="paid">Em dia</option><option value="pending">Pendente</option>
        </select>
      </>}
      columns={[
        { header: 'Nº', cell: (r) => r.jersey_number ?? '—' },
        { header: 'Nome', cell: (r) => <span className="font-medium">{r.full_name}{r.status === 'inactive' && ' (inativo)'}</span> },
        { header: 'Posição', cell: (r) => r.position ?? '—' },
        { header: 'Idade', cell: (r) => r.age ?? '—' },
        { header: 'IMC', cell: (r) => r.bmi ? <span className={`badge ${classifyBmi(r.bmi).className}`}>{r.bmi} · {r.bmi_class}</span> : '—' },
        { header: 'Início', cell: (r) => fmtDate(r.joined_at) },
        { header: 'Mensalidade', cell: (r) => <span className={`badge ${r.payment_status === 'paid' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>{r.payment_status === 'paid' ? 'Em dia' : 'Pendente'}</span> },
      ]}
      formExtra={(v) => {
        const bmi = calcBmi(Number(v.weight_kg), Number(v.height_cm)); const age = calcAge(v.birth_date)
        return <p className="text-sm rounded bg-turf-100 p-2">Idade: <b>{age ?? '—'}</b> · IMC: <b>{bmi ?? '—'}</b> ({classifyBmi(bmi).label})</p>
      }}
    />
  )
}
