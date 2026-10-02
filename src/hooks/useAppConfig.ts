import { useSyncExternalStore } from 'react'
import { getAppConfig, subscribeAppConfig } from '../lib/appConfigStore'

export function useAppConfig() {
  return useSyncExternalStore(subscribeAppConfig, getAppConfig, getAppConfig)
}
