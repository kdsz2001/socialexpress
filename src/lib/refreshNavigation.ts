/** Navegação completa: o ícone do navegador recarrega e a página lê os dados de novo. */
export function refreshNavigation(to: string) {
  const next = new URL(to, window.location.href)
  const same =
    window.location.pathname === next.pathname &&
    window.location.search === next.search &&
    window.location.hash === next.hash
  if (same) window.location.reload()
  else window.location.assign(`${next.pathname}${next.search}${next.hash}`)
}
