import { useSyncExternalStore } from 'react'
import { getHistory, subscribeHistory, type HistoryEntry } from '../lib/historyStore'

function getSnapshot(): HistoryEntry[] {
  return getHistory()
}

function getServerSnapshot(): HistoryEntry[] {
  return []
}

export function useHistory() {
  return useSyncExternalStore(subscribeHistory, getSnapshot, getServerSnapshot)
}
