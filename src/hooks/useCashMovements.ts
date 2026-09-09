import { useSyncExternalStore } from 'react'
import { listCashMovements, subscribeCashMovements } from '../lib/financialStore'

export function useCashMovements() {
  return useSyncExternalStore(subscribeCashMovements, listCashMovements, listCashMovements)
}
