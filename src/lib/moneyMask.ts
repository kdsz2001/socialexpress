/** Máscara monetária BR: dígitos → 1.234,56 (últimos 2 = centavos). */
export function maskMoneyBr(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 12)
  if (!digits) return ''
  const cents = Number(digits)
  const value = (cents / 100).toFixed(2)
  const [intPart, decPart] = value.split('.')
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${withDots},${decPart}`
}

export function moneyBrToNumber(masked: string): number {
  const digits = String(masked || '').replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits) / 100
}

export function formatMoneyBrPrefix(masked: string): string {
  const v = maskMoneyBr(masked)
  return v ? `R$ ${v}` : ''
}
