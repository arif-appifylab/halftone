import { useEffect } from 'react'
import settings from '../../settings.json'

const BASE = `${settings.name} — ${settings.tagline}`

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${settings.name}` : BASE
  }, [title])
}
