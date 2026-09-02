/**
 * Cliente do crm-bridge (Evolution API atrás do servidor).
 * Se VITE_CRM_BRIDGE_URL não existir, o CRM usa o modo simulado local.
 */

import type { CrmBackup, CrmConnectionStatus, CrmLabel, CrmLead, CrmScoreRule } from './crmStore'

const BASE = (import.meta.env.VITE_CRM_BRIDGE_URL || '').replace(/\/$/, '')

export type BridgeConnection = {
  status: CrmConnectionStatus
  accountName?: string
  accountPhone?: string
  connectedAt?: number | null
  lastSyncAt?: number | null
  qrBase64?: string | null
  pairingCode?: string | null
  lastError?: string | null
  mode?: string
}

export type BridgeSnapshot = {
  connection?: Partial<BridgeConnection>
  labels?: CrmLabel[]
  leads?: CrmLead[]
  scoreRules?: CrmScoreRule[]
  backups?: CrmBackup[]
  error?: string
}

export function crmBridgeEnabled() {
  return Boolean(BASE)
}

async function bridgeFetch<T>(pathname: string, options: RequestInit = {}): Promise<T> {
  if (!BASE) throw new Error('Bridge não configurada')
  const response = await fetch(`${BASE}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) {
    throw new Error(data.error || `Bridge HTTP ${response.status}`)
  }
  return data
}

export async function bridgeHealth() {
  return bridgeFetch<{
    ok: boolean
    evolutionConfigured: boolean
    instance: string
    publicUrl: string
  }>('/api/health')
}

export async function bridgeGetState() {
  return bridgeFetch<BridgeSnapshot>('/api/crm/state')
}

export async function bridgeConnect() {
  return bridgeFetch<BridgeConnection>('/api/whatsapp/connect', { method: 'POST' })
}

export async function bridgeStatus() {
  return bridgeFetch<BridgeConnection>('/api/whatsapp/status')
}

export async function bridgeRefreshQr() {
  return bridgeFetch<BridgeConnection>('/api/whatsapp/qr/refresh', { method: 'POST' })
}

export async function bridgePairing(number: string) {
  return bridgeFetch<BridgeConnection>('/api/whatsapp/pairing', {
    method: 'POST',
    body: JSON.stringify({ number }),
  })
}

export async function bridgeDisconnect() {
  return bridgeFetch<{ ok: boolean }>('/api/whatsapp/disconnect', { method: 'POST' })
}

export async function bridgeSetLeadLabel(leadId: string, labelId: string) {
  return bridgeFetch<BridgeSnapshot>(`/api/leads/${encodeURIComponent(leadId)}/label`, {
    method: 'PATCH',
    body: JSON.stringify({ labelId }),
  })
}

export async function bridgeCreateBackup(note?: string) {
  return bridgeFetch<BridgeSnapshot>('/api/backups', {
    method: 'POST',
    body: JSON.stringify({ note }),
  })
}
