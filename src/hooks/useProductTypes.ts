import { useSyncExternalStore } from 'react'
import { listProductTypes, subscribeProductTypes } from '../lib/productTypesStore'

export function useProductTypes() {
  return useSyncExternalStore(subscribeProductTypes, listProductTypes, listProductTypes)
}
