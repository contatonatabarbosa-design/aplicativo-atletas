import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Partner } from '../../types'

export default function MyPartners() {
  const { data = [] } = useQuery({ queryKey: ['my-partners'], queryFn: async () => (await supabase.from('partners').select('*').order('name')).data as Partner[] ?? [] })
  return (
    <section>
      <h1 className="text-4xl font-bold mb-4">Parceiros do clube</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((p) => (
          <article key={p.id} className="card">
            <h2 className="text-2xl font-bold">{p.name}</h2>
            {p.category && <p className="text-xs text-turf-700">{p.category}</p>}
            {p.benefit && <p className="mt-2 text-sm rounded bg-flag/30 p-2"><b>Benefício:</b> {p.benefit}</p>}
            {p.address && <p className="mt-2 text-sm">{p.address}</p>}
          </article>
        ))}
        {data.length === 0 && <p className="text-sm text-turf-700">Nenhum parceiro cadastrado ainda.</p>}
      </div>
    </section>
  )
}
