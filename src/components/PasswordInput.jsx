import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

function IconEye({ off = false }) {
  if (off) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 3l18 18" strokeLinecap="round" />
        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
        <path d="M6.7 6.7C4.6 8.3 3.2 10.4 2 12c1.8 3.6 6 6 10 6 1.6 0 3.1-.4 4.4-1" />
        <path d="M9.9 4.2A10.8 10.8 0 0112 4c4 0 8.2 2.4 10 6-.6 1.2-1.5 2.3-2.6 3.2" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function PasswordInput({ className = '', ...inputProps }) {
  const { t } = useI18n()
  const [show, setShow] = useState(false)

  return (
    <div className="password-field">
      <input
        {...inputProps}
        className={className || undefined}
        type={show ? 'text' : 'password'}
      />
      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={show}
        tabIndex={-1}
      >
        <IconEye off={show} />
      </button>
    </div>
  )
}
