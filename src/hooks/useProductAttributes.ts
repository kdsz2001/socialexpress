import { useCallback, useSyncExternalStore } from 'react'
import {
  listProductAttributes,
  subscribeProductAttributes,
  type ProductAttribute,
  type ProductAttributeKind,
} from '../lib/productAttributesStore'

const cache = new Map<string, ProductAttribute[]>()

function snapshot(kind?: ProductAttributeKind) {
  const key = kind ?? '*'
  const next = listProductAttributes(kind)
  const prev = cache.get(key)
  if (
    prev &&
    prev.length === next.length &&
    prev.every((item, index) => item === next[index])
  ) {
    return prev
  }
  cache.set(key, next)
  return next
}

export function useProductAttributes(kind?: ProductAttributeKind) {
  const getSnapshot = useCallback(() => snapshot(kind), [kind])
  return useSyncExternalStore(subscribeProductAttributes, getSnapshot, getSnapshot)
}
