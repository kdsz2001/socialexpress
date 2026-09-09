import { useSyncExternalStore } from 'react'
import { listSuppliers, subscribeSuppliers } from '../lib/suppliersStore'

export function useSuppliers() {
  return useSyncExternalStore(subscribeSuppliers, listSuppliers, listSuppliers)
}
