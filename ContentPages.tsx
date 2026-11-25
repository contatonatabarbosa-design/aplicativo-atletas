import CrudPage from '../../components/CrudPage'
import { POSITION_OPTIONS } from '../../lib/constants'

/** Playbook (geral e por posição). */
export function PlaybooksPage() {
  return (
    <CrudPage
      table="playbooks" title="Playbook" singular="item" orderBy={{ column: 'created_at', ascending: false }}
      defaults={{ scope: 'general' }} searchText={(r) => `${r.title} ${(r.tags ?? []).join(' ')}`}
      fields={[
        { name: 'title', label: 'Título', required: true, full: true },
        { name: 'scope', label: 'Alcance', type: 'select', required: true, options: [{ value: 'general', label: 'Geral (todos)' }, { value: 'position', label: 'Por posição' }] },
        { name: 'position', label: 'Posição', type: 'select', options: POSITION_OPTIONS, hint: 'Obrigatória quando o alcance é “Por posição”.' },
        { name: 'content', label: 'Conteúdo', type: 'textarea' },
        { name: 'tags', label: 'Tags', type: 'tags', hint: 'Separe por vírgula. Ex.: ataque, red zone' },
        { name: 'media_urls', label: 'Links de imagens/vídeos', type: 'tags', hint: 'Separe por vírgula.' },
      ]}
      columns={[
        { header: 'Título', cell: (r) => <span className="font-medium">{r.title}</span> },
        { header: 'Alcance', cell: (r) => (r.scope === 'general' ? 'Geral' : r.position) },
        { header: 'Tags', cell: (r) => (r.tags ?? []).join(', ') || '—' },
      ]}
    />
  )
}

/** Drills por posição. */
export function DrillsPage() {
  return (
    <CrudPage
      table="drills" title="Drills" singular="drill" orderBy={{ column: 'position' }}
      searchText={(r) => `${r.title} ${r.position}`}
      fields={[
        { name: 'position', label: 'Posição', type: 'select', required: true, options: POSITION_OPTIONS },
        { name: 'title', label: 'Título', required: true },
        { name: 'objective', label: 'Objetivo', type: 'textarea' },
        { name: 'instructions', label: 'Instruções', type: 'textarea' },
        { name: 'media_url', label: 'Link de vídeo/imagem', full: true },
      ]}
      columns={[
        { header: 'Posição', cell: (r) => r.position },
        { header: 'Título', cell: (r) => <span className="font-medium">{r.title}</span> },
        { header: 'Objetivo', cell: (r) => r.objective ?? '—' },
      ]}
    />
  )
}

/** Parceiros do clube. */
export function PartnersPage() {
  return (
    <CrudPage
      table="partners" title="Parceiros" singular="parceiro" orderBy={{ column: 'name' }}
      searchText={(r) => `${r.name} ${r.category ?? ''}`} defaults={{ active: true }}
      fields={[
        { name: 'name', label: 'Nome', required: true },
        { name: 'category', label: 'Categoria' },
        { name: 'address', label: 'Endereço', full: true },
        { name: 'benefit', label: 'Benefício / desconto', type: 'textarea' },
        { name: 'active', label: 'Visível para atletas', type: 'checkbox' },
      ]}
      columns={[
        { header: 'Nome', cell: (r) => <span className="font-medium">{r.name}</span> },
        { header: 'Categoria', cell: (r) => r.category ?? '—' },
        { header: 'Benefício', cell: (r) => r.benefit ?? '—' },
        { header: 'Ativo', cell: (r) => (r.active ? 'Sim' : 'Não') },
      ]}
    />
  )
}
