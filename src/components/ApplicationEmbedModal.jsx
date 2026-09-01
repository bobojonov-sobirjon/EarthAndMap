import { useEffect, useState } from 'react'
import { monitoringApi } from '../api/services'
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'
import {
  copySiteUrl,
  getEmbedFrameSrc,
  getEmbedScreenshotSrc,
  normalizeSiteUrl,
  openExternalSite,
  usesProxyEmbed,
} from '../utils/embedUrl'

export default function ApplicationEmbedModal({
  open,
  selection,
  onClose,
  onSubmitted,
}) {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [draftId, setDraftId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [shotLoading, setShotLoading] = useState(true)

  useEffect(() => {
    if (!open || !selection) return
    const text = selection.analysis_text || ''
    setTitle(selection.name || '')
    setDescription(text)
    setError('')
    setDraftId(null)
    setCopied(false)
    setShotLoading(true)

    const createDraft = async () => {
      try {
        const { data } = await monitoringApi.createSubmission({
          application_type: selection.application_type_id,
          analysis_text: text,
          match_score: selection.score,
          title: selection.name,
          description: text,
          status: 'draft',
        })
        setDraftId(data.id)
      } catch {
        /* draft ixtiyoriy */
      }
    }
    createDraft()
  }, [open, selection])

  if (!open || !selection) return null

  const siteUrl = normalizeSiteUrl(selection.site_url)
  const screenshotSrc = getEmbedScreenshotSrc(siteUrl)
  const embedSrc = getEmbedFrameSrc(siteUrl)
  const proxied = usesProxyEmbed(siteUrl)

  const handleCopy = async () => {
    const ok = await copySiteUrl(siteUrl)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        application_type: selection.application_type_id,
        analysis_text: selection.analysis_text,
        match_score: selection.score,
        title: title.trim() || selection.name,
        description: description.trim(),
        status: 'submitted',
        external_payload: { site_url: siteUrl, embed_proxy: proxied },
      }
      if (draftId) {
        await monitoringApi.patchSubmission(draftId, payload)
      } else {
        await monitoringApi.createSubmission(payload)
      }
      onSubmitted?.()
      onClose()
    } catch (err) {
      setError(apiError(err, t, 'msg.saveFail'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="problems-modal-backdrop problems-modal-backdrop--embed" role="presentation" onClick={onClose}>
      <div
        className="problems-modal problems-modal--embed"
        role="dialog"
        aria-labelledby="embed-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="problems-modal__head">
          <div>
            <h3 id="embed-title">{t('problems.formTitle')}</h3>
            <p className="muted problems-modal__sub">
              {selection.name} · {selection.score}% {t('problems.match')}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>

        {!siteUrl ? (
          <div className="problems-embed-empty muted">{t('problems.noSiteUrl')}</div>
        ) : screenshotSrc ? (
          <>
            <div className="problems-embed-toolbar">
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm problems-embed-open"
              >
                {t('problems.openSiteNewTab')}
              </a>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => openExternalSite(siteUrl)}>
                {t('problems.openSite')}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy}>
                {copied ? t('problems.linkCopied') : t('problems.copyLink')}
              </button>
            </div>
            <div className="problems-embed-wrap problems-embed-wrap--shot">
              {shotLoading && (
                <div className="problems-embed-shot-loading">
                  <div className="import-loading__spin" aria-hidden />
                  <span>{t('problems.embedProxyNote')}</span>
                </div>
              )}
              <img
                src={screenshotSrc}
                alt={selection.name}
                className="problems-embed-shot"
                onLoad={() => setShotLoading(false)}
                onError={() => setShotLoading(false)}
              />
            </div>
            <p className="muted problems-embed-proxy-note">{t('problems.embedScreenshotHint')}</p>
          </>
        ) : embedSrc ? (
          <>
            <div className="problems-embed-toolbar">
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm problems-embed-open"
              >
                {t('problems.openSiteNewTab')}
              </a>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => openExternalSite(siteUrl)}>
                {t('problems.openSite')}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy}>
                {copied ? t('problems.linkCopied') : t('problems.copyLink')}
              </button>
            </div>
            <div className="problems-embed-wrap">
              <iframe
                title={selection.name}
                src={embedSrc}
                className="problems-embed-frame"
                referrerPolicy="no-referrer"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
            {proxied && (
              <p className="muted problems-embed-proxy-note">
                {t('problems.embedProxyNote')}
                <span className="problems-embed-loading" aria-hidden />
              </p>
            )}
          </>
        ) : (
          <div className="problems-embed-external">
            <h4>{selection.name}</h4>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="problems-embed-external__url problems-embed-external__url--link"
            >
              {siteUrl}
            </a>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary problems-embed-open">
              {t('problems.openSite')}
            </a>
          </div>
        )}

        <div className="problems-embed-form">
          <label>
            {t('form.name')}
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            {t('form.desc')}
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <p className="muted problems-embed-hint">{t('problems.embedHint')}</p>
          {error && <div className="admin-error">{error}</div>}
          <div className="problems-modal__foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline problems-embed-open"
              >
                {t('problems.openSiteNewTab')}
              </a>
            )}
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? t('common.loading') : t('problems.confirmSubmit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
