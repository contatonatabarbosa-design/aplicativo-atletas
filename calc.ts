/** Idade em anos completos a partir de 'YYYY-MM-DD'. */
export function calcAge(birthDate?: string | null): number | null {
  if (!birthDate) return null
  const b = new Date(birthDate + 'T00:00:00')
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const hadBirthday =
    now.getMonth() > b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() >= b.getDate())
  if (!hadBirthday) age--
  return age
}

/** IMC = peso (kg) / altura (m)². Retorna null se faltarem dados. */
export function calcBmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null
  return Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10
}

/** Classificação da OMS. Atenção: em atletas, massa muscular elevada pode inflar o IMC. */
export function classifyBmi(bmi: number | null): { label: string; className: string } {
  if (bmi === null) return { label: '—', className: 'bg-turf-100 text-turf-900' }
  if (bmi < 18.5) return { label: 'Abaixo do peso', className: 'bg-blue-100 text-blue-900' }
  if (bmi < 25) return { label: 'Peso normal', className: 'bg-green-100 text-green-900' }
  if (bmi < 30) return { label: 'Sobrepeso', className: 'bg-yellow-100 text-yellow-900' }
  return { label: bmi < 35 ? 'Obesidade grau I' : bmi < 40 ? 'Obesidade grau II' : 'Obesidade grau III', className: 'bg-red-100 text-red-900' }
}

export const fmtDate = (d?: string | null) => (d ? new Date(d.length <= 10 ? d + 'T00:00:00' : d).toLocaleDateString('pt-BR') : '—')
export const fmtMoney = (v?: number | null) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** '#1c4d35' -> '28 77 53' (formato usado pela CSS var --brand). */
export function hexToRgbTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  return m ? `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}` : '28 77 53'
}
