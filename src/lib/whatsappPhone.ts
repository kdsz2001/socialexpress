/** Normalização de WhatsApp BR para Evolution (DDI 55 + DDD + número). */

const MAX_LOCAL = 11 // DDD + 9 dígitos
const MAX_E164_BR = 13 // 55 + 11

export function digitsOnly(value: string) {
  return String(value || '').replace(/\D/g, '')
}

/**
 * Aceita cola de +55, 55, (48), espaços, hífen etc.
 * Devolve só dígitos locais (DDD+número), 10 ou 11.
 */
export function toLocalBrazilDigits(raw: string) {
  let digits = digitsOnly(raw)

  // Remove zeros à esquerda tipo 048...
  while (digits.startsWith('0') && digits.length > 11) {
    digits = digits.slice(1)
  }

  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2)
  }

  // Se colou com país + lixo demais, pega os últimos 11
  if (digits.length > MAX_LOCAL) {
    digits = digits.slice(-MAX_LOCAL)
  }

  // Celular antigo sem o 9: DDD + 8 dígitos começando em 6–9 → insere 9
  if (digits.length === 10 && /^[1-9]{2}[6-9]/.test(digits)) {
    digits = `${digits.slice(0, 2)}9${digits.slice(2)}`
  }

  return digits.slice(0, MAX_LOCAL)
}

/** Formata para exibição: (48) 98865-0977 */
export function formatBrazilPhoneDisplay(raw: string) {
  const digits = toLocalBrazilDigits(raw)
  if (!digits) return ''

  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)

  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (rest.length <= 4) return `(${ddd}) ${rest}`
  if (rest.length <= 8) {
    // fixo: 3344-5566
    return `(${ddd}) ${rest.slice(0, rest.length - 4)}${rest.length > 4 ? '-' : ''}${rest.slice(-4)}`.replace(
      ' -',
      ' ',
    )
  }
  // celular: 98865-0977
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`
}

/** Número completo para a Evolution: 5548998650977 */
export function toEvolutionPhone(raw: string) {
  const local = toLocalBrazilDigits(raw)
  if (!local) return ''
  return `55${local}`
}

export type PhoneValidation =
  | { ok: true; local: string; evolution: string; display: string }
  | { ok: false; error: string; display: string }

export function validateWhatsappPhone(raw: string): PhoneValidation {
  const display = formatBrazilPhoneDisplay(raw)
  const local = toLocalBrazilDigits(raw)

  if (!local) {
    return { ok: false, error: 'Cole ou digite o WhatsApp com DDD.', display }
  }
  if (local.length < 10) {
    return {
      ok: false,
      error: `Número incompleto (${local.length}/11). Ex: (48) 98865-0977`,
      display,
    }
  }
  if (local.length === 10) {
    return {
      ok: false,
      error: 'Celular precisa de 11 dígitos (DDD + 9 + número). Ex: (48) 98865-0977',
      display,
    }
  }
  if (local.length !== 11) {
    return {
      ok: false,
      error: 'Use DDD + 9 dígitos (11 no total).',
      display,
    }
  }
  if (!/^[1-9]{2}9\d{8}$/.test(local)) {
    return {
      ok: false,
      error: 'Formato inválido. Use DDD + 9 + 8 dígitos.',
      display,
    }
  }

  return {
    ok: true,
    local,
    evolution: `55${local}`,
    display,
  }
}

export function phoneCharHint(raw: string) {
  const local = toLocalBrazilDigits(raw)
  return `${Math.min(local.length, MAX_LOCAL)}/${MAX_LOCAL}`
}

export const PHONE_MAX_DIGITS = MAX_LOCAL
export const PHONE_E164_MAX = MAX_E164_BR
