import { useSyncExternalStore } from 'react'
import {
  listProductTypes,
  subscribeProductTypes,
  type ProductType,
} from '../lib/productTypesStore'

let cached: ProductType[] | null = null

function snapshot() {
  const next = listProductTypes()
  if (
    cached &&
    cached.length === next.length &&
    cached.every((item, index) => item === next[index])
  ) {
    return cached
  }
  cached = next
  return next
}

export function useProductTypes() {
  return useSyncExternalStore(subscribeProductTypes, snapshot, snapshot)
}
