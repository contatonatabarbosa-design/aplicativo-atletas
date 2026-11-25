import { FormEvent, ReactNode, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import Modal from './Modal'

export type Row = Record<string, any>
export type FieldType = 'text' | 'email' | 'textarea' | 'number' | 'date' | 'select' | 'tags' | 'checkbox'

export interface FieldDef {
  name: string
  label: string
  type?: FieldType
  required?: boolean
  options?: { value: string; label: string }[]
  step?: string
  hint?: string
  /** Ocupa a linha inteira do formulário. */
  full?: boolean
}
export interface Column { header: string; cell: (row: Row) => ReactNode }

interface Props {
  table: string                       // tabela usada para escrever
  readSource?: string                 // tabela/view para ler (ex.: athletes_overview)
  select?: string                    // select do PostgREST (permite joins)
  title: string
  singular: string                   // "atleta", "parceiro"...
  fields: FieldDef[]
  columns: Column[]
  orderBy?: { column: string; ascending?: boolean }
  searchText?: (row: Row) => string
  filterFn?: (row: Row) => boolean
  toolbar?: ReactNode
  /** Conteúdo extra no formulário (ex.: IMC ao vivo). */
  formExtra?: (values: Record<string, string>) => ReactNode
  defaults?: Row
}

/** Converte a linha do banco em strings para os inputs. */
const toForm = (fields: FieldDef[], row?: Row, defaults: Row = {}) => {
  const v: Record<string, string> = {}
  for (const f of fields) {
    const raw = row ? row[f.name] : defaults[f.name]
    v[f.name] = f.type === 'tags' ? (raw ?? []).join(', ') : f.type === 'checkbox' ? String(raw ?? true) : raw == null ? '' : String(raw)
  }
  return v
}

/** Converte strings do formulário no payload tipado para o Supabase. */
const toPayload = (fields: FieldDef[], v: Record<string, string>) => {
  const p: Row = {}
  for (const f of fields) {
    const s = v[f.name]
    if (f.type === 'tags') p[f.name] = s.split(',').map((t) => t.trim()).filter(Boolean)
    else if (f.type === 'checkbox') p[f.name] = s === 'true'
    else if (s === '') p[f.name] = null
    else p[f.name] = f.type === 'number' ? Number(s) : s
  }
  return p
}

/** CRUD genérico: lista com busca, criação/edição em modal e exclusão. Reutilizado por todas as telas do gestor. */
export default function CrudPage(props: Props) {
  const { table, readSource = table, select = '*', title, singular, fields, columns, orderBy, searchText, filterFn, toolbar, formExtra, defaults } = props
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<{ row?: Row } | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const key = [readSource, select]
  const { data = [], isLoading, error: loadError } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const base = supabase.from(readSource).select(select)
      const { data, error } = orderBy ? await base.order(orderBy.column, { ascending: orderBy.ascending ?? true }) : await base
      if (error) throw error
      return data as unknown as Row[]
    },
  })

  const save = useMutation({
    mutationFn: async () => {
      const payload = toPayload(fields, values)
      const res = editing?.row
        ? await supabase.from(table).update(payload).eq('id', editing.row.id)
        : await supabase.from(table).insert(payload)
      if (res.error) throw res.error
    },
    onSuccess: () => { qc.invalidateQueries(); setEditing(null) },
    onError: (e: Error) => setError(e.message),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries(),
    onError: (e: Error) => alert(e.message),
  })

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase()
    return data.filter((r) => (!filterFn || filterFn(r)) && (!s || !searchText || searchText(r).toLowerCase().includes(s)))
  }, [data, search, filterFn, searchText])

  const open = (row?: Row) => { setError(null); setValues(toForm(fields, row, defaults)); setEditing({ row }) }
  const submit = (e: FormEvent) => { e.preventDefault(); setError(null); save.mutate() }

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-4xl font-bold mr-auto">{title}</h1>
        <button className="btn" onClick={() => open()}>Novo {singular}</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {searchText && <input className="input max-w-xs" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />}
        {toolbar}
      </div>

      {loadError && <p className="text-red-700 text-sm mb-2">Não foi possível carregar: {(loadError as Error).message}</p>}

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead><tr>{columns.map((c) => <th key={c.header} className="th">{c.header}</th>)}<th className="th" /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {columns.map((c) => <td key={c.header} className="td">{c.cell(r)}</td>)}
                <td className="td whitespace-nowrap text-right">
                  <button className="btn-ghost mr-2" onClick={() => open(r)}>Editar</button>
                  <button className="btn-ghost" onClick={() => confirm(`Excluir este ${singular}?`) && remove.mutate(r.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr><td className="td text-turf-700" colSpan={columns.length + 1}>Nenhum {singular} encontrado. Use “Novo {singular}” para cadastrar o primeiro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.row ? `Editar ${singular}` : `Novo ${singular}`} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => {
              const common = {
                id: f.name, required: f.required, value: values[f.name] ?? '',
                onChange: (e: any) => setValues((v) => ({ ...v, [f.name]: e.target.value })),
              }
              return (
                <div key={f.name} className={f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label htmlFor={f.name} className="label">{f.label}{f.required && ' *'}</label>
                  {f.type === 'textarea' ? <textarea {...common} rows={4} className="input" />
                    : f.type === 'select' ? (
                      <select {...common} className="input">
                        {!f.required && <option value="">—</option>}
                        {f.required && <option value="" disabled>Selecione…</option>}
                        {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>)
                    : f.type === 'checkbox' ? (
                      <select {...common} className="input"><option value="true">Sim</option><option value="false">Não</option></select>)
                    : <input {...common} className="input" type={f.type === 'tags' ? 'text' : f.type ?? 'text'} step={f.step} />}
                  {f.hint && <p className="text-xs text-turf-700 mt-1">{f.hint}</p>}
                </div>
              )
            })}
            {formExtra && <div className="sm:col-span-2">{formExtra(values)}</div>}
            {error && <p role="alert" className="sm:col-span-2 text-sm text-red-700">{error}</p>}
            <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}
