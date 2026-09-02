import { useSyncExternalStore } from 'react'
import { getCrmState, subscribeCrm, type CrmState } from '../lib/crmStore'

function getSnapshot(): CrmState {
  return getCrmState()
}

function getServerSnapshot(): CrmState {
  return {
    status: 'disconnected',
    connectedAt: null,
    accountName: '',
    accountPhone: '',
    qrToken: 'server',
    labels: [],
    leads: [],
    scoreRules: [],
    backups: [],
    lastSyncAt: null,
  }
}

export function useCrm() {
  return useSyncExternalStore(subscribeCrm, getSnapshot, getServerSnapshot)
}
