import { useSyncExternalStore } from 'react'
import { getShopSettings, subscribeShopSettings } from '../lib/shopSettingsStore'

export function useShopSettings() {
  return useSyncExternalStore(subscribeShopSettings, getShopSettings, getShopSettings)
}
