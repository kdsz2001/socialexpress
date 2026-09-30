const loaders: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/Dashboard'),
  '/clientes': () => import('../pages/Clients'),
  '/agenda': () => import('../pages/Agenda'),
  '/eventos': () => import('../pages/Events'),
  '/crm': () => import('../pages/Crm'),
  '/produtos': () => import('../pages/Products'),
  '/funcionarios': () => import('../pages/Employees'),
  '/pedidos': () => import('../pages/Orders'),
  '/financeiro': () => import('../pages/Financeiro'),
  '/fornecedores': () => import('../pages/Suppliers'),
  '/relatorios': () => import('../pages/Reports'),
  '/configuracoes': () => import('../pages/Settings'),
  '/historicos': () => import('../pages/History'),
}

const started = new Set<string>()

/** Aquece a seção no servidor antes do clique, sem puxar o restante do sistema. */
export function prefetchRoute(to: string) {
  const path = new URL(to, window.location.origin).pathname
  const section = path === '/' ? '/' : `/${path.split('/').filter(Boolean)[0]}`
  const loader = loaders[section]
  if (!loader || started.has(section)) return
  started.add(section)
  void loader()
}
