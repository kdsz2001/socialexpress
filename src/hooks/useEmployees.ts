import { useSyncExternalStore } from 'react'
import { listEmployees, subscribeEmployees } from '../lib/employeesStore'

export function useEmployees() {
  return useSyncExternalStore(subscribeEmployees, listEmployees, listEmployees)
}
