import { useMemo, useState } from 'react'
import {
  ClipboardList,
  CloudUpload,
  Download,
  Tag,
} from 'lucide-react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { listProducts } from '../../lib/productsStore'
import { ImportProductsModal } from '../products/ImportProductsModal'
import { PrintLabelsModal } from '../products/PrintLabelsModal'
import './ClientsSubheader.css'

function exportProductsXls() {
  const rows = listProducts()
  const header = ['Nome', 'Tipo', 'Aluguel', 'Atributos', 'Status']
  const lines = [
    header.join('\t'),
    ...rows.map((item) =>
      [item.name, item.type, item.rental, item.attributes, item.status].join('\t'),
    ),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  link.href = url
  link.download = `produtos-${stamp}.xls`
  link.click()
  URL.revokeObjectURL(url)
}

function printCatalog() {
  const rows = listProducts()
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Catálogo de produtos</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #1e1e2d; }
    h1 { font-size: 22px; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e4e6ef; padding: 10px 8px; text-align: left; font-size: 13px; }
    th { color: #a1a5b7; text-transform: uppercase; font-size: 11px; }
  </style>
</head>
<body>
  <h1>Catálogo de produtos</h1>
  <table>
    <thead>
      <tr><th>Produto</th><th>Tipo</th><th>Aluguel</th><th>Atributos</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${
        rows.length === 0
          ? '<tr><td colspan="5">Nenhum produto cadastrado</td></tr>'
          : rows
              .map(
                (item) =>
                  `<tr><td>${item.name}</td><td>${item.type || '—'}</td><td>${item.rental || '—'}</td><td>${item.attributes || '—'}</td><td>${item.status}</td></tr>`,
              )
              .join('')
      }
    </tbody>
  </table>
</body>
</html>`
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

export function ProductsSubheader() {
  const products = useProducts()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [importOpen, setImportOpen] = useState(false)
  const [labelsOpen, setLabelsOpen] = useState(false)

  const isCreate = location.pathname === '/produtos/cadastrar'
  const tab = searchParams.get('tab')
  const showListActions = !isCreate && (!tab || tab === 'todos')

  const activeCount = useMemo(
    () => products.filter((item) => item.status === 'ativo').length,
    [products],
  )

  const statusLabel =
    activeCount === 0
      ? 'Nenhum produto ativo'
      : activeCount === 1
        ? '1 produto ativo'
        : `${activeCount} produtos ativos`

  if (isCreate) {
    return (
      <header className="clients-subheader">
        <div className="clients-subheader__heading">
          <h1 className="clients-subheader__title">Cadastro de produto</h1>
        </div>
      </header>
    )
  }

  if (!showListActions) {
    return null
  }

  return (
    <>
      <header className="clients-subheader">
        <div className="clients-subheader__heading">
          <h1 className="clients-subheader__title">Produtos</h1>
          <span className="clients-subheader__sep" aria-hidden="true" />
          <p className="clients-subheader__subtitle">{statusLabel}</p>
        </div>

        <div className="clients-subheader__actions">
          <button
            type="button"
            className="clients-subheader__btn"
            aria-label="Importar"
            onClick={() => setImportOpen(true)}
          >
            <CloudUpload size={18} strokeWidth={2} />
            <span className="clients-subheader__tooltip" role="tooltip">
              Importar
            </span>
          </button>
          <button
            type="button"
            className="clients-subheader__btn clients-subheader__btn--export"
            aria-label="Exportar"
            onClick={exportProductsXls}
          >
            <Download size={18} strokeWidth={2} />
            <span className="clients-subheader__tooltip" role="tooltip">
              Exportar
            </span>
          </button>
          <button
            type="button"
            className="clients-subheader__btn"
            aria-label="Imprimir catálogo"
            onClick={printCatalog}
          >
            <ClipboardList size={18} strokeWidth={2} />
            <span className="clients-subheader__tooltip" role="tooltip">
              Imprimir catálogo
            </span>
          </button>
          <button
            type="button"
            className="clients-subheader__btn clients-subheader__btn--export"
            aria-label="Imprimir etiquetas"
            onClick={() => setLabelsOpen(true)}
          >
            <Tag size={18} strokeWidth={2} />
            <span className="clients-subheader__tooltip" role="tooltip">
              Imprimir etiquetas
            </span>
          </button>
        </div>
      </header>

      <ImportProductsModal open={importOpen} onClose={() => setImportOpen(false)} />
      <PrintLabelsModal open={labelsOpen} onClose={() => setLabelsOpen(false)} />
    </>
  )
}
