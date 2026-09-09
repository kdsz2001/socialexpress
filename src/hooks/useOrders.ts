import { useSyncExternalStore } from 'react'
import { listOrders, subscribeOrders } from '../lib/ordersStore'

export function useOrders() {
  return useSyncExternalStore(subscribeOrders, listOrders, listOrders)
}
