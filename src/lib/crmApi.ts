/**
 * Cliente do crm-bridge (Evolution API atrás do servidor).
 * Se VITE_CRM_BRIDGE_URL não existir, o CRM usa o modo simulado local.
 */

const BASE = (import.meta.env.VITE_CRM_BRIDGE_URL || '').replace(/\/$/, '')

export function crmBridgeEnabled() {
  return Boolean(BASE)
}

async function bridgeFetch(pathname, options) {
  if (!BASE) throw new Error('Bridge não configurada')
  const response = await fetch(`${BASE}${pathname}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || `Bridge HTTP ${response.status}`)
  }
  return data
}

export async function bridgeHealth() {
  return bridgeFetch('/api/health')
}

export async function bridgeGetState() {
  return bridgeFetch('/api/crm/state')
}

export async function bridgeConnect() {
  return bridgeFetch('/api/whatsapp/connect', { method: 'POST' })
}

export async function bridgeStatus() {
  return bridgeFetch('/api/whatsapp/status')
}

export async function bridgeRefreshQr() {
  return bridgeFetch('/api/whatsapp/qr/refresh', { method: 'POST' })
}

export async function bridgeDisconnect() {
  return bridgeFetch('/api/whatsapp/disconnect', { method: 'POST' })
}

export async function bridgeSetLeadLabel(leadId, labelId) {
  return bridgeFetch(`/api/leads/${encodeURIComponent(leadId)}/label`, {
    method: 'PATCH',
    body: JSON.stringify({ labelId }),
  })
}

export async function bridgeCreateBackup(note) {
  return bridgeFetch('/api/backups', {
    method: 'POST',
    body: JSON.stringify({ note }),
  })
}
