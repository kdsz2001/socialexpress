import {
  bold,
  formatHistoryDate,
  logHistory,
  plain,
  segs,
  type HistoryDiff,
  type HistoryModule,
  type HistorySegment,
} from './historyStore'
import { getUserDisplayName, getUserProfile } from './userProfileStore'

export function currentActorName() {
  return getUserDisplayName(getUserProfile()) || 'Sistema'
}

function record(
  module: HistoryModule,
  segments: HistorySegment[],
  diffs: HistoryDiff[] = [],
  userName = currentActorName(),
) {
  logHistory({ module, segments, diffs, userName })
}

export function diffLine(op: 'add' | 'remove', label: string, value: string): HistoryDiff {
  return { op, text: `${label}: ${value}` }
}

export function buildFieldDiffs(
  before: Record<string, string | number | boolean | null | undefined>,
  after: Record<string, string | number | boolean | null | undefined>,
  labels: Record<string, string>,
): HistoryDiff[] {
  const diffs: HistoryDiff[] = []
  const keys = Object.keys(labels)
  for (const key of keys) {
    const label = labels[key]
    const a = before[key]
    const b = after[key]
    const aText =
      a === null || a === undefined || a === ''
        ? ''
        : typeof a === 'boolean'
          ? a
            ? '1'
            : '0'
          : String(a)
    const bText =
      b === null || b === undefined || b === ''
        ? ''
        : typeof b === 'boolean'
          ? b
            ? '1'
            : '0'
          : String(b)
    if (aText === bText) continue
    if (aText) diffs.push(diffLine('remove', label, aText))
    if (bText) diffs.push(diffLine('add', label, bText))
  }
  return diffs
}

export function logClientCreated(name: string) {
  const actor = currentActorName()
  record(
    'Clientes',
    segs(bold(actor), ' cadastrou o cliente ', bold(name), '.'),
  )
}

export function logClientDeleted(name: string) {
  const actor = currentActorName()
  record(
    'Clientes',
    segs(bold(actor), ' removeu o cliente ', bold(name), '.'),
  )
}

export function logClientUpdated(name: string, diffs: HistoryDiff[]) {
  if (!diffs.length) return
  const actor = currentActorName()
  record(
    'Clientes',
    segs(bold(actor), ' atualizou as informações do cliente ', bold(name), ':'),
    diffs,
  )
}

export function logAppointmentCreated(title: string, date: string, time: string) {
  const actor = currentActorName()
  const dateBr = formatHistoryDate(date)
  const parts: HistorySegment[] = [
    bold(actor),
    plain(' agendou '),
    bold(title || 'Agendamento'),
    plain(' para '),
    bold(dateBr),
  ]
  if (time) {
    parts.push(plain(', às '), bold(time))
  }
  parts.push(plain('.'))
  record('Agendamentos', parts)
}

export function logAppointmentCompleted(title: string, date: string) {
  const actor = currentActorName()
  record(
    'Agendamentos',
    segs(
      bold(actor),
      ' marcou ',
      bold(title || 'Agendamento'),
      ', do dia ',
      bold(formatHistoryDate(date)),
      ', como ',
      bold('concluído'),
      '.',
    ),
  )
}

export function logAppointmentReopened(title: string, date: string) {
  const actor = currentActorName()
  record(
    'Agendamentos',
    segs(
      bold(actor),
      ' marcou ',
      bold(title || 'Agendamento'),
      ', do dia ',
      bold(formatHistoryDate(date)),
      ', como ',
      bold('pendente'),
      '.',
    ),
  )
}

export function logAppointmentUpdated(title: string, diffs: HistoryDiff[]) {
  if (!diffs.length) return
  const actor = currentActorName()
  record(
    'Agendamentos',
    segs(bold(actor), ' atualizou o agendamento ', bold(title || 'Agendamento'), ':'),
    diffs,
  )
}

export function logAppointmentDeleted(title: string, date: string) {
  const actor = currentActorName()
  record(
    'Agendamentos',
    segs(
      bold(actor),
      ' removeu o agendamento ',
      bold(title || 'Agendamento'),
      ' do dia ',
      bold(formatHistoryDate(date)),
      '.',
    ),
  )
}

export function logEventCreated(title: string, date: string) {
  const actor = currentActorName()
  record(
    'Eventos',
    segs(bold(actor), ' cadastrou o evento ', bold(title), ' para ', bold(formatHistoryDate(date)), '.'),
  )
}

export function logEventUpdated(title: string, diffs: HistoryDiff[]) {
  if (!diffs.length) return
  const actor = currentActorName()
  record(
    'Eventos',
    segs(bold(actor), ' atualizou o evento ', bold(title), ':'),
    diffs,
  )
}

export function logEventDeleted(title: string) {
  const actor = currentActorName()
  record('Eventos', segs(bold(actor), ' removeu o evento ', bold(title), '.'))
}

export function logProductCreated(name: string) {
  const actor = currentActorName()
  record('Produtos', segs(bold(actor), ' cadastrou o produto ', bold(name), '.'))
}

export function logProductUpdated(name: string, diffs: HistoryDiff[]) {
  if (!diffs.length) return
  const actor = currentActorName()
  record(
    'Produtos',
    segs(bold(actor), ' atualizou o produto ', bold(name), ':'),
    diffs,
  )
}

export function logProductDeleted(name: string) {
  const actor = currentActorName()
  record('Produtos', segs(bold(actor), ' removeu o produto ', bold(name), '.'))
}

export function logEmployeeCreated(name: string) {
  const actor = currentActorName()
  record('Funcionários', segs(bold(actor), ' cadastrou o funcionário ', bold(name), '.'))
}

export function logEmployeeUpdated(name: string, diffs: HistoryDiff[]) {
  if (!diffs.length) return
  const actor = currentActorName()
  record(
    'Funcionários',
    segs(bold(actor), ' atualizou o funcionário ', bold(name), ':'),
    diffs,
  )
}

export function logEmployeeDeleted(name: string) {
  const actor = currentActorName()
  record('Funcionários', segs(bold(actor), ' removeu o funcionário ', bold(name), '.'))
}

export function logOrderCreated(number: number, clientName: string) {
  const actor = currentActorName()
  record(
    'Pedidos',
    segs(
      bold(actor),
      ' cadastrou o pedido ',
      bold(String(number)),
      ' do cliente ',
      bold(clientName || 'Cliente'),
      '.',
    ),
  )
}

export function logOrderUpdated(number: number, diffs: HistoryDiff[]) {
  if (!diffs.length) return
  const actor = currentActorName()
  record(
    'Pedidos',
    segs(bold(actor), ' atualizou o pedido ', bold(String(number)), ':'),
    diffs,
  )
}

export function logOrderDeleted(number: number) {
  const actor = currentActorName()
  record('Pedidos', segs(bold(actor), ' removeu o pedido ', bold(String(number)), '.'))
}

export function logCashCreated(description: string, type: string, value: string) {
  const actor = currentActorName()
  const kind = type === 'entrada' ? 'entrada' : 'saída'
  record(
    'Financeiro',
    segs(
      bold(actor),
      ' registrou a ',
      bold(kind),
      ' ',
      bold(description || 'Movimentação'),
      ' de ',
      bold(value),
      '.',
    ),
  )
}

export function logCashUpdated(description: string, diffs: HistoryDiff[]) {
  if (!diffs.length) return
  const actor = currentActorName()
  record(
    'Financeiro',
    segs(bold(actor), ' atualizou a movimentação ', bold(description || 'Movimentação'), ':'),
    diffs,
  )
}

export function logCashDeleted(description: string) {
  const actor = currentActorName()
  record(
    'Financeiro',
    segs(bold(actor), ' removeu a movimentação ', bold(description || 'Movimentação'), '.'),
  )
}

export function logSupplierCreated(name: string) {
  const actor = currentActorName()
  record('Fornecedores', segs(bold(actor), ' cadastrou o fornecedor ', bold(name), '.'))
}

export function logSupplierUpdated(name: string, diffs: HistoryDiff[]) {
  if (!diffs.length) return
  const actor = currentActorName()
  record(
    'Fornecedores',
    segs(bold(actor), ' atualizou o fornecedor ', bold(name), ':'),
    diffs,
  )
}

export function logSupplierDeleted(name: string) {
  const actor = currentActorName()
  record('Fornecedores', segs(bold(actor), ' removeu o fornecedor ', bold(name), '.'))
}

export function logShopSettingsUpdated(diffs: HistoryDiff[]) {
  if (!diffs.length) return
  const actor = currentActorName()
  record(
    'Configurações',
    segs(bold(actor), ' atualizou as informações da loja:'),
    diffs,
  )
}
