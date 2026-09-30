export function settingsPath(section: string, edit?: string | null) {
  const params = new URLSearchParams()
  if (section && section !== 'loja') params.set('section', section)
  if (edit) params.set('edit', edit)
  const query = params.toString()
  return query ? `/configuracoes?${query}` : '/configuracoes'
}

export function settingsEditSubtitle(edit: string | null) {
  if (!edit) return ''
  if (edit === 'contract:new') return 'Criar novo modelo de contrato'
  if (edit.startsWith('contract:') || edit.startsWith('system:') || edit.startsWith('alert:')) {
    return 'Editar modelo de contrato'
  }
  if (edit === 'terminal:new') return 'Novo terminal de pagamento'
  if (edit.startsWith('terminal:')) return 'Atualizando terminal de pagamento'
  if (edit === 'goal:new') return 'Novo grupo de comissionamento'
  if (edit.startsWith('goal:')) return 'Editando grupo de comissionamento'
  if (edit.startsWith('permission:')) return 'Editar nível de permissão'
  return ''
}
