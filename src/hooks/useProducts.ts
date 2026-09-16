import { useSyncExternalStore } from 'react'
import { listProducts, subscribeProducts } from '../lib/productsStore'

export function useProducts() {
  return useSyncExternalStore(subscribeProducts, listProducts, listProducts)
}
