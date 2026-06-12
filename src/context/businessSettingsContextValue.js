import { createContext } from 'react'
import { buildBusinessSettings, defaultGalleryItems, defaultPromotions } from '../services/contentService.js'

export const BusinessSettingsContext = createContext({
  business: buildBusinessSettings(),
  galleryItems: defaultGalleryItems,
  promotions: defaultPromotions,
  loading: false,
})
