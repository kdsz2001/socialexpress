/** Digits only helper */
export function onlyDigits(value: string, max?: number) {
  const digits = value.replace(/\D/g, '')
  return max ? digits.slice(0, max) : digits
}

/** CPF 000.000.000-00 ou CNPJ 00.000.000/0000-00 conforme a quantidade digitada */
export function maskCpfCnpj(value: string) {
  const digits = onlyDigits(value, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function allSameDigits(digits: string) {
  return /^(\d)\1+$/.test(digits)
}

function mod11Check(digits: string, weights: number[]) {
  const sum = weights.reduce(
    (acc, weight, index) => acc + Number(digits[index]) * weight,
    0,
  )
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

/** Valida CPF brasileiro (11 dígitos + dígitos verificadores). */
export function isValidCpf(value: string) {
  const digits = onlyDigits(value)
  if (digits.length !== 11 || allSameDigits(digits)) return false

  const d1 = mod11Check(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2])
  if (d1 !== Number(digits[9])) return false

  const d2 = mod11Check(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return d2 === Number(digits[10])
}

/** Valida CNPJ brasileiro (14 dígitos + dígitos verificadores). */
export function isValidCnpj(value: string) {
  const digits = onlyDigits(value)
  if (digits.length !== 14 || allSameDigits(digits)) return false

  const d1 = mod11Check(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  if (d1 !== Number(digits[12])) return false

  const d2 = mod11Check(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return d2 === Number(digits[13])
}

/**
 * Aceita CPF (11) ou CNPJ (14) válido.
 * Valores incompletos retornam false.
 */
export function isValidCpfCnpj(value: string) {
  const digits = onlyDigits(value)
  if (digits.length === 11) return isValidCpf(digits)
  if (digits.length === 14) return isValidCnpj(digits)
  return false
}
