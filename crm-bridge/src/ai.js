export function analyzeConversation(messages, rules, base = {}) {
  const clientText = (messages || [])
    .filter((message) => message.from === 'client')
    .map((message) => message.text)
    .join(' ')
  const lower = clientText.toLocaleLowerCase('pt-BR')

  let eventType = base.eventType || ''
  if (/\bcasamento\b/.test(lower)) eventType = 'Casamento'
  else if (/\bformatura\b/.test(lower)) eventType = 'Formatura'
  else if (/\bfesta\b/.test(lower)) eventType = 'Festa'

  let suitInterest = base.suitInterest || ''
  if (/terno azul|azul marinho|\bazul\b/.test(lower)) suitInterest = 'Terno azul'
  else if (/off[\s-]?white/.test(lower)) suitInterest = 'Off white'
  else if (/cinza/.test(lower)) suitInterest = 'Cinza'
  else if (/preto/.test(lower)) suitInterest = 'Preto'
  else if (/colorido/.test(lower)) suitInterest = 'Colorido'

  let eventDate = base.eventDate || ''
  const dateMatch =
    lower.match(
      /\b(\d{1,2})\s*(?:\/|-|de)\s*(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|\d{1,2})\b/i,
    ) || lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (dateMatch) eventDate = dateMatch[0].replace(/\s+/g, ' ')

  let name = base.name || ''
  const nameMatch = clientText.match(
    /(?:meu nome [eé]|eu sou(?: a| o)?|aqui [eé](?: o| a)?)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç]+)?)/i,
  )
  if (nameMatch?.[1]) name = nameMatch[1].trim()

  const corpus = [eventType, suitInterest, clientText].join(' ').toLocaleLowerCase('pt-BR')
  const scoreHits = []
  for (const rule of rules || []) {
    if (!rule.enabled || !rule.keyword) continue
    const key = String(rule.keyword).toLocaleLowerCase('pt-BR')
    if (corpus.includes(key)) {
      scoreHits.push({ ruleId: rule.id, label: rule.keyword, points: Number(rule.points) || 0 })
    }
  }

  const score = scoreHits.reduce((sum, hit) => sum + hit.points, 0)
  const aiSummary = [
    name ? `Lead ${name}` : 'Lead em atendimento',
    eventType ? `evento: ${eventType}` : null,
    eventDate ? `data: ${eventDate}` : null,
    suitInterest ? `interesse: ${suitInterest}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    name: name || base.name || 'Cliente WhatsApp',
    eventType,
    eventDate,
    suitInterest,
    aiSummary,
    score,
    scoreHits,
  }
}
