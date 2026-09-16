import { useEffect, useId, useState } from 'react'
import { Printer, QrCode, RotateCcw, Tag, ListOrdered, X } from 'lucide-react'
import '../clients/ImportClientsModal.css'
import './PrintLabelsModal.css'

type PrintLabelsModalProps = {
  open: boolean
  onClose: () => void
}

const INFO_OPTIONS = [
  'Código',
  'Código loja',
  'Produto',
  'Descrição',
  'Tamanho',
  'Marca',
  'Valor de locação',
  'Valor de venda',
  'Cor',
] as const

export function PrintLabelsModal({ open, onClose }: PrintLabelsModalProps) {
  const titleId = useId()
  const [labelType, setLabelType] = useState<'simples' | 'qrcode'>('simples')
  const [sequence, setSequence] = useState<'sequencial' | 'personalizada'>('sequencial')
  const [selected, setSelected] = useState<string[]>(['Produto', 'Código'])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const toggleInfo = (label: string) => {
    setSelected((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    )
  }

  const printLabels = () => {
    window.print()
    onClose()
  }

  return (
    <div className="import-modal" role="presentation">
      <button
        type="button"
        className="import-modal__overlay"
        aria-label="Fechar impressão de etiquetas"
        onClick={onClose}
      />
      <div
        className="import-modal__dialog labels-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="import-modal__header">
          <h2 id={titleId} className="import-modal__title">
            Impressão de etiquetas
          </h2>
          <button
            type="button"
            className="import-modal__close"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="import-modal__body">
          <section className="labels-modal__section">
            <h3 className="labels-modal__label">
              Tipo de etiqueta <span className="labels-modal__req">*</span>
            </h3>
            <div className="labels-modal__choices">
              <button
                type="button"
                className={`labels-modal__choice${labelType === 'simples' ? ' is-active' : ''}`}
                onClick={() => setLabelType('simples')}
              >
                <Tag size={22} strokeWidth={1.75} />
                Simples
              </button>
              <button
                type="button"
                className={`labels-modal__choice${labelType === 'qrcode' ? ' is-active' : ''}`}
                onClick={() => setLabelType('qrcode')}
              >
                <QrCode size={22} strokeWidth={1.75} />
                QR Code
              </button>
            </div>
          </section>

          <section className="labels-modal__section">
            <h3 className="labels-modal__label">
              Sequência <span className="labels-modal__req">*</span>
            </h3>
            <div className="labels-modal__choices">
              <button
                type="button"
                className={`labels-modal__choice${sequence === 'sequencial' ? ' is-active' : ''}`}
                onClick={() => setSequence('sequencial')}
              >
                <RotateCcw size={22} strokeWidth={1.75} />
                Sequencial
              </button>
              <button
                type="button"
                className={`labels-modal__choice${sequence === 'personalizada' ? ' is-active' : ''}`}
                onClick={() => setSequence('personalizada')}
              >
                <ListOrdered size={22} strokeWidth={1.75} />
                Personalizada
              </button>
            </div>
          </section>

          <section className="labels-modal__section">
            <h3 className="labels-modal__label">Informações do produto</h3>
            <p className="labels-modal__hint">
              Selecione quais informações deverão constar nas etiquetas.
            </p>
            <div className="labels-modal__checks">
              {INFO_OPTIONS.map((item) => (
                <label key={item} className="labels-modal__check">
                  <input
                    type="checkbox"
                    checked={selected.includes(item)}
                    onChange={() => toggleInfo(item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <footer className="import-modal__footer">
          <button type="button" className="import-modal__cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="import-modal__submit" onClick={printLabels}>
            <Printer size={16} strokeWidth={2} />
            Imprimir etiquetas
          </button>
        </footer>
      </div>
    </div>
  )
}
