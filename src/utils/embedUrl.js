import { API_BASE_URL } from '../api/client'

/**
 * Ko'p davlat saytlari (gov.uz) to'g'ridan-to'g'ri iframe da ochilmaydi.
 */
export function normalizeSiteUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isGovUzHost(url) {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'gov.uz' || host.endsWith('.gov.uz')
  } catch {
    return false
  }
}

export function isEmbeddableUrl(url) {
  const normalized = normalizeSiteUrl(url)
  if (!normalized) return false
  if (isGovUzHost(normalized)) return true
  try {
    const host = new URL(normalized).hostname.toLowerCase()
    if (host.endsWith('uzcadastre.uz')) return false
    return true
  } catch {
    return false
  }
}

/** Selenium screenshot (gov.uz uchun — HTML proxy Next.js da buziladi). */
export function getEmbedScreenshotSrc(siteUrl) {
  const url = normalizeSiteUrl(siteUrl)
  if (!url || !isGovUzHost(url)) return ''
  return `${API_BASE_URL}/monitoring/embed/?url=${encodeURIComponent(url)}&screenshot=1`
}

/** Ichki iframe — faqat gov.uz dan boshqa saytlar. */
export function getEmbedFrameSrc(siteUrl) {
  const url = normalizeSiteUrl(siteUrl)
  if (!url || !isEmbeddableUrl(url)) return ''
  if (isGovUzHost(url)) return ''
  return url
}

export function usesProxyEmbed(siteUrl) {
  return Boolean(getEmbedScreenshotSrc(siteUrl) || getEmbedFrameSrc(siteUrl))
}

export function openExternalSite(url) {
  const href = normalizeSiteUrl(url)
  if (!href) return false
  window.open(href, '_blank', 'noopener,noreferrer')
  return true
}

export function openInSameTab(url) {
  const href = normalizeSiteUrl(url)
  if (!href) return false
  window.location.assign(href)
  return true
}

export async function copySiteUrl(url) {
  const href = normalizeSiteUrl(url)
  if (!href) return false
  try {
    await navigator.clipboard.writeText(href)
    return true
  } catch {
    return false
  }
}
