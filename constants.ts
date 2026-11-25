/** Posições do futebol americano. Para outro esporte, basta trocar esta lista. */
export const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P', 'ST']
export const POSITION_OPTIONS = POSITIONS.map((p) => ({ value: p, label: p }))

export const PAYMENT_STATUS = [
  { value: 'paid', label: 'Pago' },
  { value: 'pending', label: 'Pendente' },
  { value: 'overdue', label: 'Atrasado' },
]
