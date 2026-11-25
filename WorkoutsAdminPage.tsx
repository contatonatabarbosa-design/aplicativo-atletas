import { useQuery } from '@tanstack/react-query'
import CrudPage from '../../components/CrudPage'
import { supabase } from '../../lib/supabase'
import { fmtDate } from '../../lib/calc'

/** Visão e edição de treinos/métricas de todos os atletas. */
export default function WorkoutsAdminPage() {
  const athletes = useQuery({
    queryKey: ['athlete-options'],
    queryFn: async () => (await supabase.from('athletes').select('id, full_name').order('full_name')).data ?? [],
  })
  return (
    <CrudPage
      table="workout_logs" select="*, athletes(full_name)" title="Treinos e métricas" singular="registro"
      orderBy={{ column: 'logged_on', ascending: false }} defaults={{ category: 'gym', logged_on: new Date().toISOString().slice(0, 10) }}
      searchText={(r) => `${r.athletes?.full_name} ${r.exercise}`}
      fields={[
        { name: 'athlete_id', label: 'Atleta', type: 'select', required: true, options: (athletes.data ?? []).map((a) => ({ value: a.id, label: a.full_name })) },
        { name: 'logged_on', label: 'Data', type: 'date', required: true },
        { name: 'category', label: 'Tipo', type: 'select', required: true, options: [{ value: 'gym', label: 'Academia' }, { value: 'performance', label: 'Performance' }] },
        { name: 'exercise', label: 'Exercício', required: true },
        { name: 'muscle_group', label: 'Grupo muscular' },
        { name: 'load_kg', label: 'Carga (kg)', type: 'number', step: '0.5' },
        { name: 'sets', label: 'Séries', type: 'number' },
        { name: 'reps', label: 'Repetições', type: 'number' },
        { name: 'distance_m', label: 'Distância (m)', type: 'number', step: '0.1' },
        { name: 'speed_kmh', label: 'Velocidade (km/h)', type: 'number', step: '0.01' },
        { name: 'duration_seconds', label: 'Tempo (s)', type: 'number', step: '0.01' },
        { name: 'notes', label: 'Observações', type: 'textarea' },
      ]}
      columns={[
        { header: 'Data', cell: (r) => fmtDate(r.logged_on) },
        { header: 'Atleta', cell: (r) => r.athletes?.full_name },
        { header: 'Exercício', cell: (r) => r.exercise },
        { header: 'Carga', cell: (r) => (r.load_kg ? `${r.load_kg} kg` : '—') },
        { header: 'Séries×Reps', cell: (r) => (r.sets ? `${r.sets}×${r.reps ?? '?'}` : '—') },
        { header: 'Velocidade', cell: (r) => (r.speed_kmh ? `${r.speed_kmh} km/h` : '—') },
        { header: 'Tempo', cell: (r) => (r.duration_seconds ? `${r.duration_seconds} s` : '—') },
      ]}
    />
  )
}
