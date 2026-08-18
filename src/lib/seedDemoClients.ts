import { addClientsBulk, getClients, type ClientGender } from './clientsStore'
import { maskCpfCnpj } from './cpfCnpj'

const SEED_FLAG = 'social-express:demo-seed-1200-v1'

const FIRST_NAMES = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Eduarda',
  'Felipe',
  'Gabriela',
  'Henrique',
  'Isabela',
  'João',
  'Karina',
  'Lucas',
  'Marina',
  'Nicolas',
  'Olivia',
  'Paulo',
  'Quezia',
  'Rafael',
  'Sofia',
  'Thiago',
  'Ursula',
  'Vitor',
  'Waleska',
  'Yasmin',
  'Zeca',
  'Beatriz',
  'Caio',
  'Daniela',
  'Enzo',
  'Fernanda',
]

const LAST_NAMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Rodrigues',
  'Ferreira',
  'Almeida',
  'Costa',
  'Gomes',
  'Martins',
  'Araújo',
  'Melo',
  'Barbosa',
  'Ribeiro',
  'Carvalho',
  'Rocha',
  'Dias',
  'Nunes',
  'Moreira',
  'Cavalcanti',
]

const CITIES = [
  { cidade: 'Florianópolis', estado: 'Santa Catarina', bairro: 'Centro', cep: '88010-000', logradouro: 'Rua Felipe Schmidt' },
  { cidade: 'São José', estado: 'Santa Catarina', bairro: 'Kobrasol', cep: '88102-000', logradouro: 'Avenida Elisabete Benedet' },
  { cidade: 'Palhoça', estado: 'Santa Catarina', bairro: 'Pagani', cep: '88130-000', logradouro: 'Rua Onze de Junho' },
  { cidade: 'Joinville', estado: 'Santa Catarina', bairro: 'América', cep: '89204-000', logradouro: 'Rua do Príncipe' },
  { cidade: 'Blumenau', estado: 'Santa Catarina', bairro: 'Vila Nova', cep: '89035-000', logradouro: 'Rua 15 de Novembro' },
  { cidade: 'Curitiba', estado: 'Paraná', bairro: 'Batel', cep: '80420-090', logradouro: 'Avenida do Batel' },
  { cidade: 'Porto Alegre', estado: 'Rio Grande do Sul', bairro: 'Moinhos de Vento', cep: '90570-020', logradouro: 'Rua Padre Chagas' },
]

function pad(n: number, size: number) {
  return String(n).padStart(size, '0')
}

function mod11Check(digits: string, weights: number[]) {
  const sum = weights.reduce(
    (acc, weight, index) => acc + Number(digits[index]) * weight,
    0,
  )
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

/** Gera CPF válido e único a partir de um índice. */
export function generateValidCpf(index: number) {
  let base = pad(100000000 + index * 17 + 13, 9)
  if (/^(\d)\1+$/.test(base)) {
    base = pad(100000000 + index * 17 + 91, 9)
  }
  const d1 = mod11Check(base, [10, 9, 8, 7, 6, 5, 4, 3, 2])
  const withD1 = `${base}${d1}`
  const d2 = mod11Check(withD1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return maskCpfCnpj(`${withD1}${d2}`)
}

function formatPhone(index: number) {
  const suffix = pad(80000000 + index * 37, 8).slice(0, 8)
  return `(48) 9${suffix.slice(0, 4)}-${suffix.slice(4)}`
}

function formatBirthDate(index: number) {
  const day = (index % 28) + 1
  const month = (index % 12) + 1
  const year = 1975 + (index % 30)
  return `${pad(day, 2)}/${pad(month, 2)}/${year}`
}

function genderFor(index: number): ClientGender {
  const roll = index % 10
  if (roll === 0) return 'outros'
  return roll % 2 === 0 ? 'feminino' : 'masculino'
}

function slugName(nome: string) {
  return nome
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/**
 * Cadastra 1200 clientes fictícios (CPF válido + dados BR) uma única vez,
 * para testar paginação e abas com bastante volume.
 */
export function seedDemoClients(count = 1200) {
  if (typeof localStorage === 'undefined') return 0
  if (localStorage.getItem(SEED_FLAG) === '1') return 0

  const existing = getClients().length
  // Offset alto para não colidir com o seed anterior de 100
  const indexOffset = 10_000

  const inputs = Array.from({ length: count }, (_, i) => {
    const index = indexOffset + i
    const nome = FIRST_NAMES[i % FIRST_NAMES.length]
    const sobrenomes = `${LAST_NAMES[i % LAST_NAMES.length]} ${LAST_NAMES[(i * 3) % LAST_NAMES.length]}`
    const place = CITIES[i % CITIES.length]
    const gender = genderFor(i)
    const phone = formatPhone(index)
    const slug = slugName(nome)

    return {
      id: `demo-seed-1200-${i + 1}`,
      cpfCnpj: generateValidCpf(index),
      rg: pad(2000000 + i, 7),
      gender,
      nome,
      sobrenomes,
      chamado: i % 5 === 0 ? nome : '',
      birthDate: formatBirthDate(i),
      email: `${slug}.${i + 1}@email.com`,
      phones: [{ number: phone, primary: true, whatsapp: true }],
      facebook: '',
      instagram: i % 4 === 0 ? `@${slug}${i}` : '',
      cep: place.cep,
      logradouro: place.logradouro,
      numero: String(10 + (i % 900)),
      complemento: i % 7 === 0 ? `Apto ${(i % 40) + 1}` : '',
      estado: place.estado,
      cidade: place.cidade,
      bairro: place.bairro,
      notifyEmail: i % 3 !== 0,
      measures: [],
      observacoes:
        i % 11 === 0 ? 'Cliente de demonstração para testes de paginação.' : '',
      active: i % 13 !== 0,
      createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
    }
  })

  const created = addClientsBulk(inputs)
  localStorage.setItem(SEED_FLAG, '1')
  console.info(
    `[Social Express] Seed: ${created} clientes demo cadastrados (já havia ${existing}).`,
  )
  return created
}
