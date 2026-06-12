import { useEffect, useMemo, useState } from 'react'
import { BusinessSettingsContext } from './businessSettingsContextValue.js'
import {
  buildBusinessSettings,
  defaultGalleryItems,
  defaultPromotions,
  fetchBusinessSettings,
  fetchPublicGalleryItems,
  fetchPublicPromotions,
} from '../services/contentService.js'

function updateSeo(settings) {
  document.title = settings.seoTitle || settings.name
  let description = document.querySelector('meta[name="description"]')
  if (!description) {
    description = document.createElement('meta')
    description.setAttribute('name', 'description')
    document.head.appendChild(description)
  }
  description.setAttribute('content', settings.seoDescription || settings.shortDescription || settings.tagline)
}

export function BusinessSettingsProvider({ children }) {
  const [business, setBusiness] = useState(() => buildBusinessSettings())
  const [galleryItems, setGalleryItems] = useState(defaultGalleryItems)
  const [promotions, setPromotions] = useState(defaultPromotions)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadContent() {
      try {
        const [settings, gallery, activePromotions] = await Promise.all([
          fetchBusinessSettings(),
          fetchPublicGalleryItems(),
          fetchPublicPromotions(),
        ])
        if (!isMounted) return
        setBusiness(settings)
        setGalleryItems(gallery)
        setPromotions(activePromotions)
        updateSeo(settings)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadContent()
    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(() => ({ business, galleryItems, promotions, loading }), [business, galleryItems, promotions, loading])

  return <BusinessSettingsContext.Provider value={value}>{children}</BusinessSettingsContext.Provider>
}
