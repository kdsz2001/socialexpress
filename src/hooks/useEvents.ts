import { useSyncExternalStore } from 'react'
import { listEvents, subscribeEvents } from '../lib/eventsStore'

export function useEvents() {
  return useSyncExternalStore(subscribeEvents, listEvents, listEvents)
}
