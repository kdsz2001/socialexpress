import { useSyncExternalStore } from 'react'
import {
  getClients,
  subscribeClients,
  type Client,
} from '../lib/clientsStore'

function getSnapshot(): Client[] {
  return getClients()
}

function getServerSnapshot(): Client[] {
  return []
}

export function useClients() {
  return useSyncExternalStore(subscribeClients, getSnapshot, getServerSnapshot)
}
