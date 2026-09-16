import { useEffect, useId, useRef, useState } from 'react'
import { Check, FileSpreadsheet, X } from 'lucide-react'
import '../clients/ImportClientsModal.css'

type ImportProductsModalProps = {
  open: boolean
  onClose: () => void
}

const TEMPLATE_CSV = [
  'nome,tipo,status,valor_aluguel,atributos,foto',
  'Traje Azul Marinho,Traje,ativo,480,"tamanho:M",azul-marinho.jpg',
  'Camisa Social Branca,Camisa,ativo,120,"tamanho:G",camisa-branca.jpg',
].join('\n')

export function ImportProductsModal({ open, onClose }: ImportProductsModalProps) {
  const titleId = useId()
  const sheetInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const [sheetName, setSheetName] = useState<string | null>(null)
  const [zipName, setZipName] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSheetName(null)
      setZipName(null)
      if (sheetInputRef.current) sheetInputRef.current.value = ''
      if (zipInputRef.current) zipInputRef.current.value = ''
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const downloadTemplate = () => {
    const blob = new Blob([`\uFEFF${TEMPLATE_CSV}`], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modelo-importacao-produtos.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <div className="import-modal" role="presentation">
      <button
        type="button"
        className="import-modal__overlay"
        aria-label="Fechar importação"
        onClick={onClose}
      />

      <div
        className="import-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="import-modal__header">
          <h2 id={titleId} className="import-modal__title">
            Importação de Produtos
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
          <section className="import-modal__step">
            <h3 className="import-modal__step-title">Passo 1</h3>
            <p className="import-modal__step-text">
              Faça o download da planilha de modelo para informar os dados dos
              produtos a serem importados.
            </p>
            <button
              type="button"
              className="import-modal__download import-modal__download--soft"
              onClick={downloadTemplate}
            >
              <FileSpreadsheet size={16} strokeWidth={2} />
              Baixar planilha modelo
            </button>
          </section>

          <section className="import-modal__step">
            <h3 className="import-modal__step-title">Passo 2</h3>
            <p className="import-modal__step-text">
              Anexe a planilha com as informações dos seus produtos.
            </p>

            <label className="import-modal__file">
              <span
                className={`import-modal__file-name${sheetName ? ' has-file' : ''}`}
              >
                {sheetName ?? 'Anexe arquivo XLSX'}
              </span>
              <span className="import-modal__file-browse">Browse</span>
              <input
                ref={sheetInputRef}
                type="file"
                className="import-modal__file-input"
                accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  setSheetName(file ? file.name : null)
                }}
              />
            </label>
          </section>

          <section className="import-modal__step">
            <h3 className="import-modal__step-title">Passo 3 (opcional)</h3>
            <p className="import-modal__step-text">
              Anexe o arquivo ZIP contendo as fotos dos produtos, conforme
              descrito na planilha modelo. Caso desejar, você poderá incluir as
              fotos individualmente mais tarde.
            </p>

            <label className="import-modal__file">
              <span
                className={`import-modal__file-name${zipName ? ' has-file' : ''}`}
              >
                {zipName ?? 'Anexe arquivo ZIP'}
              </span>
              <span className="import-modal__file-browse">Browse</span>
              <input
                ref={zipInputRef}
                type="file"
                className="import-modal__file-input"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  setZipName(file ? file.name : null)
                }}
              />
            </label>
          </section>
        </div>

        <footer className="import-modal__footer">
          <button type="button" className="import-modal__cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="import-modal__submit">
            <Check size={16} strokeWidth={2.5} />
            Importar produtos
          </button>
        </footer>
      </div>
    </div>
  )
}
