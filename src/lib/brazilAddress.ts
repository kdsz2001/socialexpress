import { onlyDigits } from './cpfCnpj'

export const BRAZIL_STATES = [
  'Acre',
  'Alagoas',
  'Amapá',
  'Amazonas',
  'Bahia',
  'Ceará',
  'Distrito Federal',
  'Espírito Santo',
  'Goiás',
  'Maranhão',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Minas Gerais',
  'Pará',
  'Paraíba',
  'Paraná',
  'Pernambuco',
  'Piauí',
  'Rio de Janeiro',
  'Rio Grande do Norte',
  'Rio Grande do Sul',
  'Rondônia',
  'Roraima',
  'Santa Catarina',
  'São Paulo',
  'Sergipe',
  'Tocantins',
] as const

export type BrazilState = (typeof BRAZIL_STATES)[number]

export const UF_TO_STATE: Record<string, BrazilState> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
}

export type ViaCepResponse = {
  erro?: boolean | string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  estado?: string
  cep?: string
}

function extractDistrictTerm(bairro?: string) {
  const paren = bairro?.match(/\(([^)]+)\)/)
  return paren?.[1]?.trim() || ''
}

async function fetchViaCepList(
  uf: string,
  city: string,
  term: string,
  signal: AbortSignal,
) {
  const url = `https://viacep.com.br/ws/${uf}/${encodeURIComponent(city)}/${encodeURIComponent(term)}/json/`
  const response = await fetch(url, { signal })
  if (!response.ok) return [] as ViaCepResponse[]
  const data = (await response.json()) as ViaCepResponse[] | ViaCepResponse
  return Array.isArray(data) ? data : []
}

/**
 * Reúne bairros próximos ao CEP informado (mesma faixa + distrito,
 * quando o nome vier entre parênteses), sem listar a cidade inteira.
 */
export async function fetchAddressByCep(digits: string, signal: AbortSignal) {
  const mainResponse = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    signal,
  })
  if (!mainResponse.ok) throw new Error('CEP lookup failed')
  const main = (await mainResponse.json()) as ViaCepResponse
  if (main.erro) return { main: null, bairros: [] as string[] }

  const city = (main.localidade ?? '').trim()
  const uf = (main.uf ?? '').trim().toUpperCase()
  const prefix = digits.slice(0, 5)
  const district = extractDistrictTerm(main.bairro)

  const suffixes = [
    0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700,
    750, 800, 850, 900, 950,
  ]
  const exactSuffix = Number(digits.slice(5))
  if (!suffixes.includes(exactSuffix)) suffixes.push(exactSuffix)

  const [cepResults, districtResults] = await Promise.all([
    Promise.allSettled(
      suffixes.map(async (suffix) => {
        const cep = `${prefix}${String(suffix).padStart(3, '0')}`
        if (cep === digits) return main
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          signal,
        })
        if (!response.ok) return null
        return (await response.json()) as ViaCepResponse
      }),
    ),
    uf && city && district
      ? fetchViaCepList(uf, city, district, signal)
      : Promise.resolve([] as ViaCepResponse[]),
  ])

  const seen = new Set<string>()
  const bairros: string[] = []
  const addBairro = (name?: string) => {
    const trimmed = name?.trim()
    if (!trimmed) return
    const key = trimmed.toLocaleLowerCase('pt-BR')
    if (key === 'outro') return
    if (seen.has(key)) return
    seen.add(key)
    bairros.push(trimmed)
  }

  const isRelatedToDistrict = (name?: string) => {
    if (!district) return true
    if (!name?.trim()) return false
    return name.toLocaleLowerCase('pt-BR').includes(district.toLocaleLowerCase('pt-BR'))
  }

  addBairro(main.bairro)

  for (const result of cepResults) {
    if (result.status !== 'fulfilled' || !result.value || result.value.erro) continue
    const item = result.value
    if ((item.localidade ?? '').trim() !== city) continue
    // Na mesma faixa do CEP: só mantém se compartilhar o distrito (quando houver)
    if (district && !isRelatedToDistrict(item.bairro)) continue
    addBairro(item.bairro)
  }

  for (const item of districtResults) {
    if (item.erro) continue
    if ((item.localidade ?? '').trim() && (item.localidade ?? '').trim() !== city) {
      continue
    }
    if (!isRelatedToDistrict(item.bairro)) continue
    addBairro(item.bairro)
  }

  bairros.sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return { main, bairros }
}

/** Opção fixa no seletor de bairro (Claral). */
export const BAIRRO_OUTRO = 'outro'

export function withBairroOutroOption(options: string[]) {
  const seen = new Set<string>()
  const list: string[] = []
  for (const option of options) {
    const trimmed = option.trim()
    if (!trimmed) continue
    const key = trimmed.toLocaleLowerCase('pt-BR')
    if (key === BAIRRO_OUTRO) continue
    if (seen.has(key)) continue
    seen.add(key)
    list.push(trimmed)
  }
  list.push(BAIRRO_OUTRO)
  return list
}

export function resolveStateName(main: ViaCepResponse): string {
  return (
    main.estado ||
    (main.uf ? UF_TO_STATE[main.uf.toUpperCase()] : '') ||
    ''
  )
}

export function maskCep(value: string) {
  return onlyDigits(value, 8).replace(/^(\d{5})(\d{1,3})$/, '$1-$2')
}
