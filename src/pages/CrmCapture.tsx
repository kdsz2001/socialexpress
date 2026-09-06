import { useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import {
  bootEasyCrm,
  buildCaptureWhatsappLink,
  createLeadFromCapture,
  getCrmState,
} from '../lib/crmStore'
import './CrmCapture.css'

export function CrmCapture() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [suitInterest, setSuitInterest] = useState('')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const storePhone = useMemo(() => getCrmState().storeWhatsapp, [])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim() || !phone.trim()) {
      setError('Informe nome e WhatsApp.')
      return
    }
    bootEasyCrm()
    createLeadFromCapture({
      name: name.trim(),
      phone: phone.trim(),
      eventType: eventType.trim(),
      eventDate: eventDate.trim(),
      suitInterest: suitInterest.trim(),
      notes: notes.trim(),
    })
    setDone(true)
  }

  const waLink = buildCaptureWhatsappLink({
    storePhone,
    name: name.trim() || 'Cliente',
    phone: phone.trim() || '—',
    eventType: eventType.trim(),
    eventDate: eventDate.trim(),
    suitInterest: suitInterest.trim(),
    notes: notes.trim(),
  })

  return (
    <div className="crm-capture">
      <div className="crm-capture__card">
        <span className="crm-capture__brand">Social Express</span>
        <h1>Fale com a gente</h1>
        <p className="crm-capture__sub">
          Preencha em 30 segundos. Nossa equipe entra em contato pelo WhatsApp.
        </p>

        {done ? (
          <div className="crm-capture__done">
            <CheckCircle2 size={28} strokeWidth={2.25} />
            <h2>Recebemos seu pedido</h2>
            <p>Seu lead já está no CRM da loja neste aparelho.</p>
            {waLink ? (
              <a className="crm-capture__primary" href={waLink} target="_blank" rel="noreferrer">
                <MessageCircle size={16} strokeWidth={2.25} />
                Também enviar no WhatsApp
              </a>
            ) : null}
            <button
              type="button"
              className="crm-capture__ghost"
              onClick={() => {
                setDone(false)
                setName('')
                setPhone('')
                setEventType('')
                setEventDate('')
                setSuitInterest('')
                setNotes('')
              }}
            >
              Enviar outro
            </button>
          </div>
        ) : (
          <form className="crm-capture__form" onSubmit={onSubmit}>
            <label>
              Seu nome *
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Seu WhatsApp *
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(47) 99999-0000"
                required
              />
            </label>
            <label>
              Tipo de evento
              <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                <option value="">Selecione…</option>
                <option value="Casamento">Casamento</option>
                <option value="Formatura">Formatura</option>
                <option value="Festa">Festa</option>
                <option value="Aniversário">Aniversário</option>
                <option value="Outro">Outro</option>
              </select>
            </label>
            <label>
              Data do evento
              <input
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="15/11/2026"
              />
            </label>
            <label>
              Interesse de traje
              <input
                value={suitInterest}
                onChange={(e) => setSuitInterest(e.target.value)}
                placeholder="Terno azul, off white…"
              />
            </label>
            <label>
              Observações
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Conta um pouco o que você precisa"
              />
            </label>
            {error ? <p className="crm-capture__error">{error}</p> : null}
            <button type="submit" className="crm-capture__primary">
              Enviar para o CRM
            </button>
            {waLink ? (
              <a className="crm-capture__ghost" href={waLink} target="_blank" rel="noreferrer">
                <MessageCircle size={15} strokeWidth={2.25} />
                Ou abrir WhatsApp da loja
              </a>
            ) : (
              <p className="crm-capture__hint">
                Dica: a loja pode cadastrar o WhatsApp em CRM → Formulário para liberar o botão
                direto.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
