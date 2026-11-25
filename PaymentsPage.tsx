import { useQuery } from '@tanstack/react-query'
import CrudPage from '../../components/CrudPage'
import { supabase } from '../../lib/supabase'
import { fmtDate, fmtMoney } from '../../lib/calc'
import { PAYMENT_STATUS } from '../../lib/constants'

const badge: Record<string, string> = { paid: 'bg-green-100 text-green-900', pending: 'bg-yellow-100 text-yellow-900', overdue: 'bg-red-100 text-red-900' }

export default function PaymentsPage() {
  const athletes = useQuery({
    queryKey: ['athlete-options'],
    queryFn: async () => (await supabase.from('athletes').select('id, full_name').order('full_name')).data ?? [],
  })
  return (
    <CrudPage
      table="payments" select="*, athletes(full_name)" title="Mensalidades" singular="lançamento"
      orderBy={{ column: 'reference_month', ascending: false }} defaults={{ status: 'pending' }}
      searchText={(r) => r.athletes?.full_name ?? ''}
      fields={[
        { name: 'athlete_id', label: 'Atleta', type: 'select', required: true, options: (athletes.data ?? []).map((a) => ({ value: a.id, label: a.full_name })) },
        { name: 'reference_month', label: 'Mês de referência', type: 'date', required: true, hint: 'Use o dia 1 do mês (ex.: 2026-12-01).' },
        { name: 'amount', label: 'Valor (R$)', type: 'number', step: '0.01', required: true },
        { name: 'status', label: 'Situação', type: 'select', required: true, options: PAYMENT_STATUS },
        { name: 'paid_at', label: 'Pago em', type: 'date' },
      ]}
      columns={[
        { header: 'Atleta', cell: (r) => r.athletes?.full_name },
        { header: 'Mês', cell: (r) => fmtDate(r.reference_month) },
        { header: 'Valor', cell: (r) => fmtMoney(r.amount) },
        { header: 'Situação', cell: (r) => <span className={`badge ${badge[r.status]}`}>{PAYMENT_STATUS.find((s) => s.value === r.status)?.label}</span> },
        { header: 'Pago em', cell: (r) => fmtDate(r.paid_at) },
      ]}
    />
  )
}
