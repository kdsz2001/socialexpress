import { useSyncExternalStore } from 'react'
import {
  listProductAttributes,
  subscribeProductAttributes,
  type ProductAttributeKind,
} from '../lib/productAttributesStore'

export function useProductAttributes(kind?: ProductAttributeKind) {
  return useSyncExternalStore(
    subscribeProductAttributes,
    () => listProductAttributes(kind),
    () => listProductAttributes(kind),
  )
}
