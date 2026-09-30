export const CIDADES_SC = [
  'Araranguá',
  'Balneário Camboriú',
  'Biguaçu',
  'Blumenau',
  'Brusque',
  'Caçador',
  'Camboriú',
  'Canoinhas',
  'Chapecó',
  'Concórdia',
  'Criciúma',
  'Florianópolis',
  'Gaspar',
  'Içara',
  'Imbituba',
  'Indaial',
  'Itajaí',
  'Jaraguá do Sul',
  'Joaçaba',
  'Joinville',
  'Lages',
  'Laguna',
  'Mafra',
  'Navegantes',
  'Palhoça',
  'Rio do Sul',
  'São Bento do Sul',
  'São José',
  'Tubarão',
  'Videira',
  'Xanxerê',
]

const CIDADES: Record<string, string[]> = {
  Acre: ['Rio Branco'],
  Alagoas: ['Maceió'],
  Amapá: ['Macapá'],
  Amazonas: ['Manaus'],
  Bahia: ['Salvador', 'Feira de Santana', 'Vitória da Conquista'],
  Ceará: ['Fortaleza', 'Juazeiro do Norte'],
  'Distrito Federal': ['Brasília'],
  'Espírito Santo': ['Vitória', 'Vila Velha', 'Serra'],
  Goiás: ['Goiânia', 'Anápolis'],
  Maranhão: ['São Luís'],
  'Mato Grosso': ['Cuiabá'],
  'Mato Grosso do Sul': ['Campo Grande', 'Dourados'],
  'Minas Gerais': ['Belo Horizonte', 'Uberlândia', 'Contagem'],
  Pará: ['Belém'],
  Paraíba: ['João Pessoa', 'Campina Grande'],
  Paraná: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa'],
  Pernambuco: ['Recife', 'Olinda', 'Jaboatão dos Guararapes'],
  Piauí: ['Teresina'],
  'Rio de Janeiro': ['Rio de Janeiro', 'Niterói', 'São Gonçalo'],
  'Rio Grande do Norte': ['Natal'],
  'Rio Grande do Sul': ['Porto Alegre', 'Caxias do Sul', 'Pelotas'],
  Rondônia: ['Porto Velho'],
  Roraima: ['Boa Vista'],
  'Santa Catarina': CIDADES_SC,
  'São Paulo': ['São Paulo', 'Campinas', 'Santos', 'São José dos Campos', 'Ribeirão Preto'],
  Sergipe: ['Aracaju'],
  Tocantins: ['Palmas'],
}

export const BAIRROS_JOINVILLE = [
  'América',
  'Anita Garibaldi',
  'Atiradores',
  'Aventureiro',
  'Boa Vista',
  'Bom Retiro',
  'Bucarein',
  'Centro',
  'Comasa',
  'Costa e Silva',
  'Dona Francisca (Pirabeiraba)',
  'Espinheiros',
  'Floresta',
  'Glória',
  'Guanabara',
  'Iririú',
  'Itaum',
  'Jardim Iririú',
  'Jardim Paraíso',
  'Jardim Sofia',
  'João Costa',
  'Morro do Meio',
  'Nova Brasília',
  'Paranaguamirim',
  'Parque Guarani',
  'Petrópolis',
  'Pirabeiraba',
  'Saguaçu',
  'Santo Antônio',
  'São Marcos',
  'Vila Nova',
  'Zona Industrial Norte',
]

export function citiesFor(estado: string): string[] {
  return CIDADES[estado] ?? []
}

export function neighborhoodsFor(cidade: string): string[] {
  if (cidade === 'Joinville') return BAIRROS_JOINVILLE
  if (!cidade) return []
  return ['Centro']
}

export function withCurrent(options: string[], current: string): string[] {
  if (current && !options.includes(current)) return [current, ...options]
  return options
}
