import { useI18n } from '../i18n/I18nContext'

export default function PageLoader({ label, compact = false }) {
  const { t } = useI18n()
  return (
    <div className={`page-loader${compact ? ' page-loader--compact' : ''}`} role="status" aria-live="polite">
      <div className="page-loader__mark" aria-hidden>
        <span className="page-loader__ring page-loader__ring--outer" />
        <span className="page-loader__ring page-loader__ring--mid" />
        <span className="page-loader__dot" />
      </div>
      <p className="page-loader__label">{label || t('common.loading')}</p>
    </div>
  )
}
