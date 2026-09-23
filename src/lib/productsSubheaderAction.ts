import { useEffect, useState } from 'react'

export type ProductsSubheaderAction = {
  label: string
  onClick: () => void
}

let action: ProductsSubheaderAction | null = null
const listeners = new Set<() => void>()

function publish(next: ProductsSubheaderAction | null) {
  action = next
  listeners.forEach((listener) => listener())
}

/** Botão da faixa branca (ex.: Adicionar tipo), registrado pela página ativa. */
export function useProductsSubheaderAction(next: ProductsSubheaderAction | null) {
  const label = next?.label ?? null
  const onClick = next?.onClick
  useEffect(() => {
    if (!label || !onClick) {
      publish(null)
      return () => publish(null)
    }
    publish({ label, onClick })
    return () => publish(null)
  }, [label, onClick])
}

export function useRegisteredProductsSubheaderAction() {
  const [current, setCurrent] = useState(action)
  useEffect(() => {
    const listener = () => setCurrent(action)
    listeners.add(listener)
    setCurrent(action)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  return current
}
