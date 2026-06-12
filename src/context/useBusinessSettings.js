import { useContext } from 'react'
import { BusinessSettingsContext } from './businessSettingsContextValue.js'

export function useBusinessSettings() {
  return useContext(BusinessSettingsContext)
}
